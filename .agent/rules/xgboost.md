---
trigger: model_decision
description: When working in the Machine Learning model with XGboost
---

# Building XGBoost From Source

XGBoost is a gradient boosting library. This guide details how to build and install XGBoost from source code for various systems and language bindings.

## 1. Obtaining the Source Code

XGBoost uses Git submodules. Clone the repository with the `--recursive` option:

```bash
git clone --recursive https://github.com/dmlc/xgboost
```

## 2. Building the Shared Library

The shared library (`libxgboost.so` on Linux/UNIX, `libxgboost.dylib` on MacOS, `xgboost.dll` on Windows) is the core component.

**Minimum Requirements:**
*   C++17 compliant compiler (gcc, clang, MSVC). Mingw is only supported for the R package with limited features.
*   CMake 3.18 or higher.

**Build Process (Unix-like systems and Windows):**

```bash
cd xgboost
cmake -B build -S . -DCMAKE_BUILD_TYPE=RelWithDebInfo -GNinja
cd build && ninja
```

The shared object will be located under the `xgboost/lib` directory.

**Platform-specific Notes:**
*   **MacOS:** Install `libomp` via Homebrew: `brew install libomp`.
*   **Visual Studio:** Supports CMake projects natively. Use "open with visual studio" from the source directory.

### 2.1. Building with GPU Support

Requires an up-to-date CUDA toolkit. CUDA is particular about compiler versions; refer to the [CUDA installation guide](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html) for compatible compilers.
If `nvcc` compiler errors occur, specify the compiler paths: `-DCMAKE_CXX_COMPILER=/path/to/correct/g++ -DCMAKE_C_COMPILER=/path/to/correct/gcc`.

**Command for GPU build (Linux):**

```bash
cmake -B build -S . -DUSE_CUDA=ON -GNinja
cd build && ninja
```

To optimize compilation, specify your GPU's compute version (e.g., `-DCMAKE_CUDA_ARCHITECTURES=75`).

**Faster Distributed GPU training with NCCL (Linux only):**
Distributed GPU training uses NCCL2 (available at [NVIDIA NCCL](https://developer.nvidia.com/nccl)).

```bash
cmake -B build -S . -DUSE_CUDA=ON -DUSE_NCCL=ON -DNCCL_ROOT=/path/to/nccl2 -GNinja
cd build && ninja
```

**NCCL-related CMake flags:**
*   `BUILD_WITH_SHARED_NCCL`: Build XGBoost with NCCL as a shared library.
*   `USE_DLOPEN_NCCL`: Load NCCL at runtime using `dlopen`.

### 2.2. Federated Learning Support

Requires `grpc` and `protobuf`. Install `grpc` from its [installation guide](https://grpc.io/docs/languages/cpp/quickstart/) or use conda forge packages.
**Note:** Only Linux is supported for the federated plugin.

**Command for Federated Learning build:**

```bash
cmake -B build -S . -DPLUGIN_FEDERATED=ON -GNinja
cd build && ninja
```

## 3. Building Python Package from Source

The Python package is located in the `python-package/` directory.

### 3.1. Building Python Package with Default Toolchains

1.  **Build C++ core first, then install Python package:**
    First, build the C++ shared library as described in "Building the Shared Library". The `pip install .` command will then reuse the existing `lib/libxgboost.so`.

    ```bash
    cd python-package/
    pip install .
    ```

2.  **Install the Python package directly (automatic C++ core build):**
    If the shared object is not present, `pip install` will automatically run the CMake build. Requires Pip 22.1 or later for `--config-settings`.

    ```bash
    cd python-package/
    pip install -v . # Builds the shared object automatically.
    ```
    To enable additional compilation options:
    ```bash
    pip install -v . --config-settings use_cuda=True --config-settings use_nccl=True
    ```

    **Available `--config-settings` options:**
    ```python
    @dataclasses.dataclass
    class BuildConfiguration:
        hide_cxx_symbols: bool = True     # Whether to hide C++ symbols in libxgboost.so
        use_openmp: bool = True           # Whether to enable OpenMP
        use_cuda: bool = False            # Whether to enable CUDA
        use_nccl: bool = False            # Whether to enable NCCL
        use_dlopen_nccl: bool = False     # Whether to load nccl dynamically
        plugin_federated: bool = False    # Whether to enable federated learning
        plugin_rmm: bool = False          # Whether to enable rmm support
        use_system_libxgboost: bool = False # Use pre-existing libxgboost.so on system path
    ```
    *Note:* Use the verbose flag (`-v`) for `pip install` to monitor the C++ build progress.

3.  **Editable installation:**
    Allows immediate reflection of source code changes. First, build the shared library, then install with the `-e` flag.

    ```bash
    # Build shared library libxgboost.so
    cmake -B build -S . -GNinja
    cd build && ninja
    # Install as editable installation
    cd ../python-package
    pip install -e .
    ```

4.  **Reuse `libxgboost.so` on system path:**
    Useful for package managers. Ensure `libxgboost.so` is in the system library path and pass `use_system_libxgboost=True`.

    ```python
    import sys
    import pathlib
    libpath = pathlib.Path(sys.base_prefix).joinpath("lib", "libxgboost.so")
    assert libpath.exists()
    ```
    ```bash
    cd python-package
    pip install . --config-settings use_system_libxgboost=True
    ```

## 4. Building R Package From Source

Requires git and a recent C++11 compliant compiler. MSVC and CMake build are not supported for the R package on Windows.

### 4.1. Installing the development version (Linux / Mac OSX)

After obtaining the source code recursively:

```bash
cd R-package
R CMD INSTALL .
```
Use `MAKEFLAGS=-j$(nproc)` to speed up the build.
Alternatively, load with `devtools`:
```R
library(devtools)
devtools::load_all(path = "/path/to/xgboost/R-package")
```

For greater flexibility with compile flags (Linux only):

```bash
cmake -B build -S . -DR_LIB=ON -GNinja
cd build && ninja install
```
Custom configurations (compilers, flags) must be set via CMake variables (e.g., `-DCMAKE_CXX_COMPILER`) not `Makevars` file.

### 4.2. Building R package with GPU support

Requirements are similar to general GPU support.

**Command (Linux):**

```bash
cmake -B build -S . -DUSE_CUDA=ON -DR_LIB=ON
cmake --build build --target install -j$(nproc)
```
This builds the R package shared library in `build` and runs `R CMD INSTALL` after assembling the package files.

## 5. Building JVM Packages

XGBoost4J requires Maven 3+, Java 7+, CMake 3.18+, and a `python` command available on the system path (some systems use `python3`).
Set the `JAVA_HOME` environment variable to your JDK directory.

**Build and install to local Maven repository:**

```bash
cd jvm-packages
mvn package          # Build with tests
mvn -DskipTests=true package # Build skipping tests
mvn install          # Publish to local repository with tests
mvn -DskipTests install # Publish to local repository skipping tests
```

**Maven Dependency:**

```xml
<dependency>
  <groupId>ml.dmlc</groupId>
  <artifactId>xgboost4j</artifactId>
  <version>latest_source_version_num</version>
</dependency>
```

**SBT Dependency:**

```scala
resolvers += "Local Maven Repository" at "file://"+Path.userHome.absolutePath+"/.m2/repository"

"ml.dmlc" % "xgboost4j" % "latest_source_version_num"
```
For Spark integration, replace `xgboost4j` with `xgboost4j-spark`.

**XGBoost4J-Spark Notes:**
*   Requires Apache Spark 3.4+.
*   Install Spark directly from the [Apache website](https://spark.apache.org/). Not guaranteed to work with third-party Spark distributions.

### 5.1. Additional System-dependent Features for JVM Packages

*   **OpenMP on MacOS:** Install `openmp` as described in "Running CMake and build". Disable with `mvn -Duse.openmp=OFF`.
*   **GPU support:** Enable with `mvn -Duse.cuda=ON install`. See "Building with GPU support" for details.
*   **RMM support:** Enable with `-Dplugin.rmm=ON`.

## 6. Building the Documentation

XGBoost documentation uses [Sphinx](https://www.sphinx-doc.org/en/stable/).

**Requirements:**
*   Installed XGBoost with all its dependencies.
*   System dependencies: `git`, `graphviz`.
*   Python dependencies: specified in `doc/requirements.txt`.

**Build Process:**

```bash
cd xgboost/doc
make <format> # Replace <format> with desired output (e.g., html).
              # Run 'make help' for a list of supported formats.
```
This builds a partial document for Python. For full documentation, refer to [Documentation and Examples](https://xgboost.readthedocs.io/en/stable/contrib/docs.html).