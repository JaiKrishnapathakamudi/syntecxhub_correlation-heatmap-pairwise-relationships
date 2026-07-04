import os
import pandas as pd
from src.generator import generate_synthetic_data
from src.analyzer import (
    load_and_preprocess_data,
    compute_pearson_correlation,
    get_strongest_relationships,
    plot_correlation_heatmap,
    plot_pairwise_relationships
)

def main():
    print("==========================================================")
    # 1. Paths configuration
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'data')
    output_dir = os.path.join(base_dir, 'output')
    
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, 'sample_data.csv')
    heatmap_path = os.path.join(output_dir, 'correlation_heatmap.png')
    pairplot_path = os.path.join(output_dir, 'pairwise_relationships.png')
    
    # 2. Check or generate synthetic data
    if not os.path.exists(csv_path):
        print(f"[*] Dataset not found. Generating synthetic customer data...")
        df = generate_synthetic_data(num_samples=500, random_seed=42)
        df.to_csv(csv_path, index=False)
        print(f"[+] Dataset successfully created: {csv_path}")
    else:
        print(f"[+] Found existing dataset: {csv_path}")
        df = pd.read_csv(csv_path)
    
    print(f"[i] Dataset shape: {df.shape}")
    print(f"[i] Columns: {list(df.columns)}")
    
    # 3. Load & preprocess (extract numeric features)
    _, df_numeric = load_and_preprocess_data(csv_path)
    print(f"[i] Numeric columns selected for analysis: {list(df_numeric.columns)}")
    
    # 4. Compute Pearson correlation
    print("[*] Computing Pearson correlation coefficients...")
    corr_matrix = compute_pearson_correlation(df_numeric)
    
    print("\n--- Pearson Correlation Matrix ---")
    print(corr_matrix.round(3).to_string())
    
    # 5. Extract and print strongest relationships
    print("\n[*] Analyzing correlation strengths...")
    relationships = get_strongest_relationships(corr_matrix, top_n=3)
    
    print("\n>>> Strongest Positive Correlations:")
    for idx, row in relationships['positive'].iterrows():
        print(f"  {idx+1}. {row['Feature_1']} <--> {row['Feature_2']}: {row['Correlation']:.3f}")
        
    print("\n>>> Strongest Negative Correlations:")
    for idx, row in relationships['negative'].iterrows():
        print(f"  {idx+1}. {row['Feature_1']} <--> {row['Feature_2']}: {row['Correlation']:.3f}")
        
    # 6. Generate visualizations
    print("\n[*] Generating correlation heatmap...")
    # Use light theme by default
    plot_correlation_heatmap(corr_matrix, output_path=heatmap_path, theme='light')
    
    print("[*] Generating pairwise scatter plots...")
    # Select key variables to visualize relationships
    key_variables = ['Age', 'Annual_Income', 'Spending_Score', 'Savings']
    # Use Gender as hue to show categorical splits
    plot_pairwise_relationships(df, columns=key_variables, output_path=pairplot_path, hue_column='Gender', theme='light')
    
    print("\n==========================================================")
    print("[+] All tasks completed successfully!")
    print(f"    - Visualizations saved to: {output_dir}")
    print("==========================================================")

if __name__ == "__main__":
    main()
