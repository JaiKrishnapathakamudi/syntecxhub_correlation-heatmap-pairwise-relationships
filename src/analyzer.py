import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def load_and_preprocess_data(csv_path):
    """
    Loads the CSV file and extracts numeric columns for correlation analysis.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Data file not found at: {csv_path}")
    
    df = pd.read_csv(csv_path)
    # Select only numeric columns
    numeric_df = df.select_dtypes(include=[np.number])
    
    return df, numeric_df

def compute_pearson_correlation(df_numeric):
    """
    Computes the Pearson correlation matrix for the numeric features.
    """
    return df_numeric.corr(method='pearson')

def get_strongest_relationships(corr_matrix, top_n=5):
    """
    Identifies the strongest positive and negative relationships,
    excluding self-correlations and avoiding duplicate pairs (A-B and B-A).
    """
    # Get the upper triangle of the matrix to avoid duplicates
    # and self-correlations (diagonal)
    mask = np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
    
    # Reset index to create a long-form DataFrame of pairwise correlations
    pairs = corr_matrix.where(mask).stack().reset_index()
    pairs.columns = ['Feature_1', 'Feature_2', 'Correlation']
    
    # Calculate absolute correlation for sorting
    pairs['Abs_Correlation'] = pairs['Correlation'].abs()
    
    # Separate positive and negative correlations
    pos_corr = pairs[pairs['Correlation'] > 0].sort_values(by='Correlation', ascending=False).head(top_n)
    neg_corr = pairs[pairs['Correlation'] < 0].sort_values(by='Correlation', ascending=True).head(top_n)
    
    # Top absolute relationships overall
    top_overall = pairs.sort_values(by='Abs_Correlation', ascending=False).head(top_n)
    
    return {
        'positive': pos_corr.reset_index(drop=True),
        'negative': neg_corr.reset_index(drop=True),
        'overall': top_overall.reset_index(drop=True)
    }

def plot_correlation_heatmap(corr_matrix, output_path=None, theme='light'):
    """
    Generates a beautiful correlation heatmap.
    - Masks the upper triangle.
    - Annotates cells with correlation values.
    - Uses a professional diverging colormap.
    """
    # Set the style based on the theme
    if theme == 'dark':
        plt.style.use('dark_background')
        bg_color = '#121212'
        text_color = '#E0E0E0'
        grid_color = '#2C2C2C'
    else:
        plt.style.use('default')
        bg_color = '#FFFFFF'
        text_color = '#333333'
        grid_color = '#E5E5E5'

    # Create mask for the upper triangle
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    
    # Set up the matplotlib figure
    fig, ax = plt.subplots(figsize=(10, 8), dpi=150)
    fig.patch.set_facecolor(bg_color)
    ax.set_facecolor(bg_color)
    
    # Custom diverging colormap (Blue to Red via light grey/white)
    # Using HSL-like balanced colors
    cmap = sns.diverging_palette(230, 20, as_cmap=True)
    
    # Draw the heatmap with the mask and correct aspect ratio
    sns.heatmap(
        corr_matrix, 
        mask=mask, 
        cmap=cmap, 
        vmax=1.0, 
        vmin=-1.0, 
        center=0,
        square=True, 
        linewidths=1.5, 
        cbar_kws={"shrink": 0.7, "label": "Pearson Correlation Coefficient"},
        annot=True, 
        fmt=".2f",
        annot_kws={"size": 10, "weight": "semibold", "color": "#1C1C1C"},
        ax=ax
    )
    
    # Customize titles and labels
    ax.set_title(
        'Pearson Correlation Matrix of Customer Metrics', 
        fontsize=16, 
        weight='bold', 
        pad=20, 
        color=text_color
    )
    
    # Style tick labels
    ax.set_xticklabels(ax.get_xticklabels(), rotation=35, ha='right', fontsize=11, color=text_color)
    ax.set_yticklabels(ax.get_yticklabels(), rotation=0, fontsize=11, color=text_color)
    
    plt.tight_layout()
    
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
        print(f"Heatmap saved successfully to: {output_path}")
    
    return fig, ax

def plot_pairwise_relationships(df, columns, output_path=None, hue_column=None, theme='light'):
    """
    Plots pairwise relationships / scatter matrix using Seaborn pairplot.
    Includes regression lines for scatter plots and KDEs for diagonals.
    """
    if theme == 'dark':
        plt.style.use('dark_background')
        # Dark style configurations for Seaborn
        sns.set_theme(style="darkgrid", rc={
            "axes.facecolor": "#1E1E1E",
            "grid.color": "#2C2C2C",
            "figure.facecolor": "#121212",
            "text.color": "#E0E0E0",
            "axes.labelcolor": "#E0E0E0",
            "xtick.color": "#A0A0A0",
            "ytick.color": "#A0A0A0"
        })
    else:
        plt.style.use('default')
        sns.set_theme(style="ticks", rc={
            "axes.facecolor": "#FAFAFA",
            "grid.color": "#E5E5E5",
            "figure.facecolor": "#FFFFFF",
            "text.color": "#333333",
            "axes.labelcolor": "#333333"
        })
        
    # Configure pairplot grid
    # We use kind='reg' to show linear fits, diagonal kind='kde' for density estimates
    g = sns.pairplot(
        df, 
        vars=columns, 
        hue=hue_column,
        kind='reg', 
        diag_kind='kde',
        palette='husl' if hue_column else None,
        plot_kws={
            'scatter_kws': {'alpha': 0.5, 's': 20, 'edgecolor': 'none'},
            'line_kws': {'color': '#E74C3C', 'linewidth': 2}
        },
        diag_kws={'fill': True, 'alpha': 0.4}
    )
    
    # Adjust spacing and title
    g.fig.suptitle(
        'Pairwise Relationships of Key Customer Variables', 
        fontsize=18, 
        weight='bold', 
        y=1.02
    )
    
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        g.savefig(output_path, bbox_inches='tight')
        print(f"Pairplot saved successfully to: {output_path}")
        
    return g
