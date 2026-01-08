---
trigger: model_decision
description: When you use it numpyro, be guide by this document
---

# Workspace Rule – NumPyro

## Purpose
Provide a practical guide to help users write, inspect, and debug **NumPyro** code: probabilistic modeling, MCMC (NUTS/HMC), SVI, distributions, and handlers, aligned with the official README and docs [web:2][web:10].

---

## Overview

- NumPyro is a lightweight probabilistic programming library providing a NumPy backend for **Pyro**, built on **JAX** for autodiff and JIT (CPU/GPU/TPU) [web:2][web:5].
- It is a **flexible substrate**: users write regular Python + JAX code plus Pyro primitives (`sample`, `param`, `plate`).
- It focuses on:
  - Gradient‑based MCMC (HMC, NUTS and variants).
  - Stochastic Variational Inference (SVI) with many ELBOs and autoguides.
  - A distributions API closely mirroring `torch.distributions` [web:10][web:16].

---

## Installation and Environment

Suggested install commands and dependencies [web:2][web:20]:

- CPU (recommended to start):
```bash
pip install numpyro
# or, if JAX compatibility issues arise:
pip install 'numpyro[cpu]'
```

- GPU (after CUDA installation):

```bash
pip install 'numpyro[cuda]' -f https://storage.googleapis.com/jax-releases/jax_cuda_releases.html
```

- From source:

```bash
git clone https://github.com/pyro-ppl/numpyro.git
cd numpyro
pip install -e '.[dev]'
```

Key points:

- Windows support is limited; WSL2 + JAX + CUDA is recommended when using Windows [attached_file:1].
- Use `jax.numpy` instead of plain NumPy inside differentiable model code to work with JAX’s autodiff and JIT [web:5].
- JAX has no global RNG state; always use `jax.random.PRNGKey` and `random.split` [web:5][attached_file:1].

---

## Modeling Primitives and Style

### Pyro Primitives in NumPyro

NumPyro supports the usual Pyro primitives [web:10][web:13]:

- `numpyro.sample(name, dist, obs=...)`
- `numpyro.param(name, init_value, ...)`
- `numpyro.plate(name, size, subsample_size=None)`
- `numpyro.module` (via contrib) and effect handlers in `numpyro.handlers`.

Guidelines:

- Write models as **pure functions**: `def model(...): ...` without hidden global side effects.
- Use clear, stable names for sites (`"mu"`, `"tau"`, `"theta"`, `"obs"`, etc.).
- Use `plate` for i.i.d. dimensions instead of Python loops whenever possible [web:5].


### RNG and `numpyro.sample` outside inference

- Outside MCMC/SVI/handlers, `numpyro.sample` **requires** an explicit `rng_key` [attached_file:1]:

```python
from jax.random import PRNGKey
import numpyro
import numpyro.distributions as dist

x = numpyro.sample("x", dist.Normal(0, 1), rng_key=PRNGKey(0))
```

- Inside inference (MCMC/SVI), RNG is managed via `handlers.seed` behind the scenes [attached_file:1].

If `numpyro.sample` is used with no key and no inference context, either:

- Pass `rng_key=PRNGKey(...)`, or
- Wrap the code in `numpyro.handlers.seed(rng_seed=...)` [attached_file:1].

---

## Canonical Example – 8 Schools

Use this as a blueprint for simple hierarchical models [web:10][attached_file:1].

### Data

```python
import numpy as np

J = 8
y = np.array([28.0, 8.0, -3.0, 7.0, -1.0, 1.0, 18.0, 12.0])
sigma = np.array([15.0, 10.0, 16.0, 11.0, 9.0, 11.0, 10.0, 18.0])
```


### Centered model

```python
import numpyro
import numpyro.distributions as dist

def eight_schools(J, sigma, y=None):
    mu = numpyro.sample("mu", dist.Normal(0, 5))
    tau = numpyro.sample("tau", dist.HalfCauchy(5))
    with numpyro.plate("J", J):
        theta = numpyro.sample("theta", dist.Normal(mu, tau))
        numpyro.sample("obs", dist.Normal(theta, sigma), obs=y)
```


### Running NUTS/MCMC

```python
from jax import random
from numpyro.infer import MCMC, NUTS

nuts_kernel = NUTS(eight_schools)
mcmc = MCMC(nuts_kernel, num_warmup=500, num_samples=1000)
rng_key = random.PRNGKey(0)
mcmc.run(rng_key, J, sigma, y=y, extra_fields=("potential_energy",))
mcmc.print_summary()
samples = mcmc.get_samples()
pe = mcmc.get_extra_fields()["potential_energy"]
```

[web:10][attached_file:1]

Best practices:

- Use `extra_fields` when diagnostics (potential energy, acceptance probabilities, etc.) are needed.
- `r_hat > 1` and low `n_eff`, especially for `tau`, plus many divergences indicate geometric pathologies [attached_file:1].

---

## Reparameterization and Pathologies

For models with “bad geometry” (like centered 8 schools), use non‑centered reparameterization via `TransformReparam` [web:10][web:7]:

```python
from numpyro.infer.reparam import TransformReparam
import numpyro.distributions as dist

def eight_schools_noncentered(J, sigma, y=None):
    mu = numpyro.sample("mu", dist.Normal(0, 5))
    tau = numpyro.sample("tau", dist.HalfCauchy(5))
    with numpyro.plate("J", J):
        with numpyro.handlers.reparam(config={"theta": TransformReparam()}):
            theta = numpyro.sample(
                "theta",
                dist.TransformedDistribution(
                    dist.Normal(0., 1.),
                    dist.transforms.AffineTransform(mu, tau),
                ),
            )
        numpyro.sample("obs", dist.Normal(theta, sigma), obs=y)
```

Key ideas:

- Non‑centered parameterizations can drastically improve `r_hat`, `n_eff`, and reduce divergences [web:10].
- For `loc, scale` families (Normal, Cauchy, StudentT, …) `LocScaleReparam(centered=0)` is a convenient shorthand [attached_file:1].

Use such reparameterization when:

- There are many NUTS divergences.
- Diagnostics show poor mixing for scale parameters.

---

## Posterior Predictive Inference

Use `Predictive` for prior predictive checks and posterior predictive simulations [web:10][web:11]:

```python
from numpyro.infer import Predictive
from jax import random
import numpyro.distributions as dist
import numpyro

def new_school():
    mu = numpyro.sample("mu", dist.Normal(0, 5))
    tau = numpyro.sample("tau", dist.HalfCauchy(5))
    return numpyro.sample("obs", dist.Normal(mu, tau))

predictive = Predictive(new_school, mcmc.get_samples())
samples_predictive = predictive(random.PRNGKey(1))
```

- `Predictive` conditions on posterior samples (e.g. `mu`, `tau`) to generate new observations [web:10][attached_file:1].
- It can also be used without posterior samples for pure prior predictive checks.

---

## Inference Algorithms

### MCMC

NumPyro provides several MCMC kernels [web:2][web:7]:

- **NUTS**: adaptive HMC; default for continuous latent variables.
- **HMC**: basic Hamiltonian Monte Carlo.
- **MixedHMC**: for mixed continuous/discrete latent variables.
- **HMCECS**: uses data subsampling for large datasets (continuous latents).
- **BarkerMH**: gradient‑based alternative to HMC/NUTS for some models.
- **HMCGibbs / DiscreteHMCGibbs**: combine HMC/NUTS with Gibbs updates; discrete Gibbs steps can be derived automatically.
- **SA** (Simulated Annealing): gradient‑free MCMC for non‑differentiable log densities but typically needs many samples [web:7].

Guidelines:

- Default choice: `NUTS` for continuous models.
- For discrete latents with small finite support, use enumeration with `infer={"enumerate": "parallel"}` when feasible [web:7].
- For very large datasets, consider `HMCECS` or SVI instead of full‑data MCMC [web:7].


### SVI (Stochastic Variational Inference)

Main ELBOs and autoguides [web:7][web:14]:

- ELBOs:
    - `Trace_ELBO`: basic ELBO.
    - `TraceMeanField_ELBO`: partly analytic when possible.
    - `TraceGraph_ELBO`: variance reduction for discrete latents.
    - `TraceEnum_ELBO`: enumeration for discrete latents when tractable.
- Autoguides:
    - `AutoNormal`, `AutoDiagonalNormal`: basic mean‑field guides; automatically handle constrained supports.
    - `AutoMultivariateNormal`, `AutoLowRankMultivariateNormal`: richer Normal guides capturing correlations; more expensive.
    - `AutoDelta`: MAP (point estimate).
    - `AutoBNAFNormal`, `AutoIAFNormal`: normalizing‑flow‑based guides.
    - `AutoDAIS`, `AutoSurrogateLikelihoodDAIS`, `AutoSemiDAIS`: powerful HMC‑based variational methods, some supporting data subsampling.
    - `AutoLaplaceApproximation`: Laplace approximation [web:7].

Good defaults:

- Start with `AutoNormal` + `Trace_ELBO` for moderate continuous models.
- Use `TraceGraph_ELBO` or `TraceEnum_ELBO` for models with important discrete latents and feasible enumeration [web:7].

---

## Distributions, Constraints, and Transforms

- `numpyro.distributions` follows the design and batching semantics of `torch.distributions` [web:10][attached_file:1].
- It includes:
    - Common distributions (Normal, Bernoulli, Beta, Dirichlet, etc.).
    - `constraints` for bounded supports (positive, simplex, intervals).
    - `transforms` for bijective mappings (Affine, Sigmoid, etc.).
- TensorFlow Probability distributions can be used in NumPyro models via a compatibility wrapper [attached_file:1].

Recommended usage:

- Keep distribution names and parameter conventions consistent with Pyro/PyTorch where possible.
- Use appropriate constraints and transforms when parameters must be positive or bounded.

---

## Effect Handlers

`numpyro.handlers` offers flexible interpretation of primitives [web:10][attached_file:1]:

- Common handlers:
    - `seed(rng_seed=...)`: injects a PRNGKey.
    - `reparam(config={...})`: reparameterizes sites.
    - `condition(data={...})`: conditions on observed values.

Typical patterns:

- `handlers.seed` is useful when sampling manually with `numpyro.sample` outside MCMC/SVI [attached_file:1].
- `handlers.reparam` is central for non‑centered parameterizations and coordinate transforms.

---

## Differences from Pyro (PyTorch)

Important points for Pyro users [attached_file:1][web:10]:

- No global RNG or global parameter store:
    - No `pyro.get_param_store()`.
    - RNG always explicit or via `handlers.seed`.
- Models should be more **functional** to work well with JAX JIT and `vmap`.
- Tensor ops:
    - Replace `torch` operations with `jax.numpy` equivalents.
    - Some `torch` operations do not have direct `jax.numpy` counterparts and vice versa.

Common pitfalls to avoid:

- Calling `numpyro.sample` outside inference without `rng_key` or `seed`.
- Using `torch` tensors/functions inside NumPyro models.
- Relying on side effects that JAX cannot trace.


## Recommended Imports and Workflow

Typical imports:

```python
import numpyro
import numpyro.distributions as dist
from numpyro.infer import MCMC, NUTS, SVI, Trace_ELBO
from numpyro.infer import Predictive
from jax import random
import jax.numpy as jnp
```

Typical workflow:

1. Define data (`numpy` or `jax.numpy` arrays).
2. Write a `model` function using `sample/param/plate`.
3. Choose an inference method:
    - MCMC: `NUTS`, `HMC`, or other kernels.
    - SVI: ELBO + autoguide.
4. Run inference (`mcmc.run` or `svi.run`).
5. Extract results:
    - Posterior samples via `mcmc.get_samples()`.
    - Optimized parameters via `svi.get_params()`.

Diagnostic guidance:

- Monitor `r_hat`, `n_eff`, number of divergences, and potential energy.
- If diagnostics are poor, consider:
    - Reparameterization (non‑centered).
    - Tuning step size or mass matrix.
    - Switching to a more suitable inference algorithm [web:7][attached_file:1].