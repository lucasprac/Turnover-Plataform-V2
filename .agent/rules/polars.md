---
trigger: model_decision
description: when you use it polars, be guide by this document
---

# Polars – Blazingly Fast DataFrames

## Summary

Polars is a **high-performance** DataFrame library written in Rust with bindings for Python, R, and Node.js, designed for fast, parallel, and memory-efficient data processing. It offers an intuitive API, a powerful lazy query engine with optimization, out-of-core streaming, and optional GPU acceleration, making it ideal for analytics and data engineering workloads.[^1][^2][^3]

***

## Environment Setup

### 1. Install Polars (Python)

- Using `pip` (recommended):

```bash
python -m pip install polars
```

- With optional integrations (NumPy, pandas converters, etc.):

```bash
python -m pip install "polars[numpy,pandas]"
# or everything:
python -m pip install "polars[all]"
```


### 2. Basic Verification

```python
import polars as pl

print(pl.__version__)
```

If this runs without error, Polars is installed correctly.[^4]

### 3. Optional: Rust / R / Node.js

- Rust: add `polars` to `Cargo.toml` and enable desired features (e.g. `csv`, `lazy`).[^5][^1]
- R: install the `polars` R package (R bindings for the same query engine).[^6]
- Node.js: use the official Node bindings from the Polars project (same core engine).[^2][^1]

***

## Step-by-Step Usage Guide

### 1. Creating DataFrames (Eager API)

Eager execution runs operations immediately, similar to pandas.[^7]

```python
import polars as pl

# From dict
df = pl.DataFrame({
    "foo": [1, 2, 3],
    "bar": [6.0, 7.0, 8.0],
    "ham": ["a", "b", "c"],
})
print(df)

# From CSV (eager)
df_csv = pl.read_csv("docs/assets/data/iris.csv")
print(df_csv.head())
```

Key points:

- DataFrames are 2D tables with labeled columns, each column having a fixed data type.[^1][^8]
- You can construct them from dictionaries, lists of Series, NumPy arrays, or pandas DataFrames.[^8]


### 2. Core Eager Operations

```python
# Select columns
result = df.select(
    pl.col("foo"),
    (pl.col("bar") * 0.95).round(2).alias("bar_discounted"),
)

# Filter rows
filtered = df.filter(pl.col("foo") > 1)

# Group by and aggregate
agg = (
    df
    .group_by("ham")
    .agg(
        pl.col("foo").sum().alias("foo_sum"),
        pl.col("bar").mean().alias("bar_mean"),
    )
)

print(result)
print(filtered)
print(agg)
```


### 3. Lazy API with `scan_csv` (Recommended for Larger Data)

Lazy execution builds a query plan, optimizes it, and executes only when `.collect()` is called.[^3]

```python
import polars as pl

q = (
    pl.scan_csv("docs/assets/data/iris.csv")  # lazy scan; no data read yet
    .filter(pl.col("sepal_length") > 5)
    .group_by("species")
    .agg(pl.all().sum())
)

df_result = q.collect()  # execute optimized query
print(df_result)
```

Polars:

- Pushes filters and projections down to the scan, reducing I/O and memory.[^3][^9]
- Uses parallel and vectorized execution to fully utilize CPU cores.[^2][^1]


### 4. Rust Lazy Example (Equivalent to Python)

```rust
use polars::prelude::*;

fn main() -> PolarsResult<()> {
    let q = LazyCsvReader::new(PlPath::new("docs/assets/data/iris.csv"))
        .with_has_header(true)
        .finish()?
        .filter(col("sepal_length").gt(lit(5)))
        .group_by(vec![col("species")])
        .agg([col("*").sum()]);

    let df = q.collect()?;
    println!("{df}");
    Ok(())
}
```


### 5. I/O and Streaming

Write to CSV and read back:

```python
df.write_csv("docs/assets/data/output.csv")

df_csv = pl.read_csv("docs/assets/data/output.csv", try_parse_dates=True)
print(df_csv)
```

Streaming lazy execution (out-of-core):

```python
lazy = pl.scan_csv("large_file.csv")
result = (
    lazy
    .group_by("key")
    .agg(pl.col("value").sum())
    .collect(streaming=True)  # process in chunks
)
```

Streaming allows handling datasets larger than RAM by processing in batches instead of loading everything into memory at once.[^7][^1]

***

## Conceptual Explanation

Polars is designed as an analytical query engine with these core ideas:[^10][^1]

- **Columnar + Arrow-compatible**: Uses columnar data structures and integrates with Apache Arrow for fast, cache friendly operations and zero-copy exchange where possible.[^5][^1]
- **Lazy query engine**: Encourages building queries as expression trees; the optimizer applies predicate and projection pushdown, expression simplification, and other rewrites before execution.[^3][^1]
- **Parallel and vectorized**: Workloads are automatically split across CPU cores, and operations are vectorized to reduce Python overhead.[^2][^1]
- **Out-of-core \& streaming**: The engine can operate on data streams, so input does not need to fit into memory.[^7][^1]
- **Strict schemas**: Column data types are known and enforced, catching schema problems early and enabling better optimization.[^8][^1]

Because the core is written in Rust, Polars achieves C/C++-level performance while providing safe memory management and predictable behavior.[^5][^1]

***

## Best Practices

- Prefer **lazy API** (`scan_csv`, `.lazy()`) for anything non-trivial or large; use eager only for quick interactive exploration.[^7][^3]
- Push transformations into expressions (e.g. `select`, `with_columns`, `group_by().agg(...)`) instead of writing Python loops. This keeps work inside the optimized engine.[^11][^12]
- Read data with `scan_*` (e.g. `scan_csv`, `scan_parquet`) so filters and column selections can be pushed down.[^9]
- Use explicit schemas for critical pipelines to avoid unexpected type inference changes.[^1][^8]
- When dealing with huge data, enable streaming in `.collect(streaming=True)` where supported.[^11]
- Use Arrow and optional `numpy/pandas` extras only at the edges of your system for interoperability, keeping the core of your pipeline in Polars.[^4][^1]

***

## Example Use Cases

### 1. Large CSV Aggregation

```python
import polars as pl

sales = pl.scan_csv("sales_*.csv")  # glob pattern

result = (
    sales
    .filter(pl.col("date") >= "2025-01-01")
    .group_by("product_id")
    .agg(
        pl.col("revenue").sum().alias("total_revenue"),
        pl.col("units").sum().alias("total_units"),
    )
    .sort("total_revenue", descending=True)
    .collect(streaming=True)
)

print(result.head())
```


### 2. Feature Engineering for ML

```python
import polars as pl

df = pl.read_parquet("events.parquet")

features = (
    df.lazy()
    .group_by("user_id")
    .agg(
        pl.count().alias("event_count"),
        pl.col("value").mean().alias("value_mean"),
        pl.col("timestamp").max().alias("last_event"),
    )
    .collect()
)

print(features)
```


### 3. Rust Backend Data Pipeline

Use Polars in a Rust service to run analytics close to the data:

```rust
use polars::prelude::*;

fn user_stats() -> PolarsResult<DataFrame> {
    let df = CsvReadOptions::default()
        .try_into_reader_with_file_path(Some("users.csv".into()))?
        .finish()?;

    let mask = df.column("age")?.i32()?.gt(30);
    let df_small = df.filter(&mask)?;

    let df_agg = df_small
        .group_by(["country"])?
        .select(["age"])?
        .mean()?;

    Ok(df_agg)
}
```

These examples illustrate how to build full pipelines using Polars’ lazy and eager APIs, exploiting parallelism, optimization, and streaming to handle anything from interactive analysis to production-scale data workloads.[^2][^12][^1]
<span style="display:none">[^13][^14][^15][^16][^17][^18][^19][^20]</span>

<div align="center">⁂</div>

[^1]: https://docs.pola.rs

[^2]: https://pola.rs

[^3]: https://docs.pola.rs/user-guide/concepts/lazy-api/

[^4]: https://realpython.com/polars-python/

[^5]: https://docs.rs/polars/latest/polars/

[^6]: https://pola-rs.github.io/r-polars/

[^7]: https://www.datacamp.com/tutorial/python-polars-tutorial-complete-guide-for-beginners

[^8]: https://docs.pola.rs/py-polars/html/reference/dataframe/index.html

[^9]: https://docs.pola.rs/api/python/dev/reference/api/polars.scan_csv.html

[^10]: https://github.com/pola-rs/polars

[^11]: https://realpython.com/polars-lazyframe/

[^12]: https://docs.pola.rs/user-guide/getting-started/

[^13]: https://docs.pola.rs/api/python/stable/reference/

[^14]: https://github.com/pola-rs/polars-book

[^15]: https://docs.pola.rs/polars-cloud/quickstart/

[^16]: https://docs.pola.rs/py-polars/html/reference/lazyframe/api/polars.LazyFrame.group_by.html

[^17]: https://pola.rs/posts/case-decathlon/

[^18]: https://www.youtube.com/watch?v=9IrMz0wbp5Q

[^19]: https://docs.pola.rs/api/python/dev/reference/api/polars.from_dict.html

[^20]: https://www.freecodecamp.org/news/how-to-use-the-polars-library-in-python-for-data-analysis/