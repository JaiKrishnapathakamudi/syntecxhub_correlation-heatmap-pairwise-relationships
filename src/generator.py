import os
import numpy as np
import pandas as pd

def generate_synthetic_data(num_samples=500, random_seed=42):
    """
    Generates a synthetic customer dataset with predefined Pearson correlations.
    
    Variables:
    1. Age (years)
    2. Annual_Income (k$)
    3. Spending_Score (1-100)
    4. Savings (k$)
    5. Monthly_Visits (count)
    6. Years_As_Member (years)
    7. Debt (k$)
    """
    np.random.seed(random_seed)
    
    # 1. Define means
    means = [
        40.0,   # Age
        75.0,   # Annual_Income
        50.0,   # Spending_Score
        45.0,   # Savings
        12.0,   # Monthly_Visits
        5.0,    # Years_As_Member
        20.0    # Debt
    ]
    
    # 2. Define standard deviations
    stds = [
        12.0,   # Age
        25.0,   # Annual_Income
        22.0,   # Spending_Score
        20.0,   # Savings
        5.0,    # Monthly_Visits
        3.0,    # Years_As_Member
        12.0    # Debt
    ]
    
    # 3. Define target correlation matrix (must be positive semi-definite)
    # Order: Age, Annual_Income, Spending_Score, Savings, Monthly_Visits, Years_As_Member, Debt
    corr_matrix = np.array([
        [ 1.0,  0.1, -0.15,  0.2, -0.05,  0.6,  0.05], # Age
        [ 0.1,  1.0,  0.35,  0.7,  0.25,  0.15,  0.3 ], # Annual_Income
        [-0.15, 0.35,  1.0, -0.55,  0.75, -0.05,  0.15], # Spending_Score
        [ 0.2,  0.7, -0.55,  1.0, -0.3,   0.25, -0.4 ], # Savings
        [-0.05, 0.25,  0.75, -0.3,  1.0,  0.0,   0.1 ], # Monthly_Visits
        [ 0.6,  0.15, -0.05,  0.25, 0.0,   1.0,  0.0 ], # Years_As_Member
        [ 0.05, 0.3,   0.15, -0.4,  0.1,   0.0,   1.0 ]  # Debt
    ])
    
    # 4. Compute covariance matrix: Cov = D * R * D
    D = np.diag(stds)
    cov_matrix = D @ corr_matrix @ D
    
    # Ensure cov_matrix is positive semi-definite (handling numerical precision/bounds issues)
    val, vec = np.linalg.eigh(cov_matrix)
    val = np.maximum(val, 1e-8)
    cov_matrix = vec @ np.diag(val) @ vec.T
    
    # 5. Generate multivariate normal samples
    raw_data = np.random.multivariate_normal(means, cov_matrix, size=num_samples)
    
    # 6. Convert to DataFrame and apply realistic boundaries (clipping & rounding)
    df = pd.DataFrame(raw_data, columns=[
        'Age', 'Annual_Income', 'Spending_Score', 'Savings', 
        'Monthly_Visits', 'Years_As_Member', 'Debt'
    ])
    
    # Post-process columns to make them realistic
    df['Age'] = df['Age'].clip(18, 80).astype(int)
    df['Annual_Income'] = df['Annual_Income'].clip(15, 200).round(1)
    df['Spending_Score'] = df['Spending_Score'].clip(1, 100).round(0).astype(int)
    df['Savings'] = df['Savings'].clip(0, 150).round(1)
    df['Monthly_Visits'] = df['Monthly_Visits'].clip(0, 30).astype(int)
    df['Years_As_Member'] = df['Years_As_Member'].clip(0, df['Age'] - 18).astype(int)
    df['Debt'] = df['Debt'].clip(0, 100).round(1)
    
    # Add a non-numeric/identifier column (Customer_ID)
    df.insert(0, 'Customer_ID', [f'CUST_{i+1:04d}' for i in range(num_samples)])
    
    # Add a categorical column (Gender) to show that analyzer filters out non-numeric
    np.random.seed(random_seed + 1)
    df['Gender'] = np.random.choice(['Female', 'Male'], size=num_samples, p=[0.52, 0.48])
    
    return df

if __name__ == "__main__":
    # Test generation
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    os.makedirs(data_dir, exist_ok=True)
    df = generate_synthetic_data()
    csv_path = os.path.join(data_dir, 'sample_data.csv')
    df.to_csv(csv_path, index=False)
    print(f"Generated synthetic dataset with shape {df.shape} and saved to {csv_path}")
    print("\nFirst few rows:")
    print(df.head())
    print("\nActual Pearson Correlations (numeric only):")
    print(df.select_dtypes(include=[np.number]).corr().round(2))
