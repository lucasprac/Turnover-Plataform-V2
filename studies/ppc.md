# Chapter 7  
# Introduction to Prediction

In previous chapters the focus was on learning about **parameters**, such as a population mean or proportion, based on sample data. In this chapter, the focus is on **prediction**: using a model and observed data to predict future or unobserved outcomes. The Bayesian framework provides a natural way to form predictive distributions that incorporate uncertainty both in the parameter and in the data-generating process.

Prediction is important in many real-world applications. For example:

- Forecasting the number of customers who will visit a store next week.
- Predicting the number of system failures in an industrial process.
- Estimating the number of goals a team will score in a future match.
- Anticipating the number of emails arriving in an inbox tomorrow.

In a Bayesian context, prediction is done through the **posterior predictive distribution**, which averages the model for the data over the uncertainty in the parameter, as captured by the posterior distribution.

---

## 7.1 Posterior predictive checking

Posterior predictive checking is a technique for assessing whether a Bayesian model provides a reasonable description of the observed data. The basic idea is:

1. Use the observed data to obtain the posterior distribution of the unknown parameter(s).
2. Use the posterior distribution to generate **replicated** or **simulated** data that the model would predict.
3. Compare the replicated data to the actual observed data using plots or summary statistics.

If the model is a good description of the data, then the observed data should look typical or plausible among the replicated data sets generated from the posterior predictive distribution. If the observed data look extreme or unusual compared to the replicated data, this suggests a potential model mismatch.

### 7.1.1 Posterior predictive distribution

Suppose \(Y\) denotes the observed data and \(\theta\) denotes the unknown parameter. The posterior distribution of \(\theta\) given \(Y\) is \(p(\theta \mid Y)\). To predict a future or replicated observation \(\tilde{Y}\), we use the **posterior predictive distribution**:
\[
p(\tilde{Y} \mid Y) = \int p(\tilde{Y} \mid \theta)\, p(\theta \mid Y)\, d\theta.
\]

This expression shows that the predictive distribution is obtained by averaging the sampling distribution \(p(\tilde{Y} \mid \theta)\) over the posterior distribution \(p(\theta \mid Y)\). In practice, this integral is often approximated by simulation:

1. Draw \(\theta^{(1)}, \theta^{(2)}, \dots, \theta^{(M)}\) from the posterior \(p(\theta \mid Y)\).
2. For each \(\theta^{(m)}\), draw a replicated value \(\tilde{Y}^{(m)}\) from \(p(\tilde{Y} \mid \theta^{(m)})\).
3. The collection \(\tilde{Y}^{(1)}, \dots, \tilde{Y}^{(M)}\) represents draws from \(p(\tilde{Y} \mid Y)\).

### 7.1.2 Posterior predictive checks

To perform a posterior predictive check, we choose one or more **discrepancy measures** or **test statistics** \(T(Y)\) that capture specific aspects of the data that are of interest (for example, the mean, variance, maximum, or tail behavior). For each posterior draw \(\theta^{(m)}\):

1. Simulate replicated data \(\tilde{Y}^{(m)} \sim p(\tilde{Y} \mid \theta^{(m)})\).
2. Compute \(T(\tilde{Y}^{(m)})\).
3. Compare the distribution of \(T(\tilde{Y}^{(m)})\) to the observed value \(T(Y)\).

If \(T(Y)\) is in the middle of the distribution of \(T(\tilde{Y}^{(m)})\), then the model is consistent with the observed feature captured by \(T\). If \(T(Y)\) is in the tails of this distribution, the model may not be adequately capturing that aspect of the data.

A commonly used summary of this comparison is the **posterior predictive p-value**:
\[
p_{\text{ppc}} = P\left( T(\tilde{Y}) \geq T(Y) \mid Y \right),
\]
which can be approximated by:
\[
\hat{p}_{\text{ppc}} = \frac{1}{M} \sum_{m=1}^M I\big( T(\tilde{Y}^{(m)}) \geq T(Y) \big),
\]
where \(I(\cdot)\) is the indicator function that equals 1 if its argument is true and 0 otherwise.

Values of \(\hat{p}_{\text{ppc}}\) near 0 or 1 indicate that the observed statistic is extreme relative to the replicated statistics, signaling potential model misfit. Values near 0.5 typically suggest that the model fits that aspect of the data reasonably well.

### 7.1.3 Example setup

Consider count data \(Y_1, \dots, Y_n\) that we model as independent draws from a Poisson distribution with rate \(\lambda\):
\[
Y_i \mid \lambda \sim \text{Poisson}(\lambda), \quad i = 1, \dots, n.
\]

Suppose we use a Gamma prior for \(\lambda\),
\[
\lambda \sim \text{Gamma}(\alpha, \beta),
\]
with shape parameter \(\alpha\) and rate parameter \(\beta\).

Given observed data \(y_1, \dots, y_n\), the posterior distribution of \(\lambda\) is also Gamma:
\[
\lambda \mid y_1, \dots, y_n \sim \text{Gamma}\left(\alpha + \sum_{i=1}^n y_i,\; \beta + n\right).
\]

To perform posterior predictive checks, we:

1. Draw \(\lambda^{(m)}\) from the posterior Gamma distribution.
2. For each \(\lambda^{(m)}\), generate replicated data \(\tilde{Y}_1^{(m)}, \dots, \tilde{Y}_n^{(m)}\) independently from \(\text{Poisson}(\lambda^{(m)})\).
3. Compute a test statistic on both the observed data and replicated data, for example:
   - The sample mean:
     \[
     T_{\text{mean}}(Y) = \frac{1}{n} \sum_{i=1}^n Y_i.
     \]
   - The sample maximum:
     \[
     T_{\max}(Y) = \max\{Y_1, \dots, Y_n\}.
     \]
4. Compare the empirical distribution of \(T_{\text{mean}}(\tilde{Y}^{(m)})\) and \(T_{\max}(\tilde{Y}^{(m)})\) to the observed values \(T_{\text{mean}}(Y)\) and \(T_{\max}(Y)\).

If, for example, the observed maximum is much larger than the maxima seen in the replicated data, this might suggest that the Poisson model underestimates the tail behavior or variability of the data, and a different model (such as a Negative Binomial) may be more appropriate.

Posterior predictive checking is an iterative process: after detecting a misfit, we propose an improved model, refit it, and repeat the posterior predictive checks.

