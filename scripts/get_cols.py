import pandas as pd
cols = pd.read_csv('synthetic_turnover_data.csv', nrows=0).columns.tolist()
with open('cols.txt', 'w') as f:
    f.write(str(cols))
