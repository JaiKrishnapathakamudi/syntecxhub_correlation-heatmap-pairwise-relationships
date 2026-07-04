# Correlation Heatmap & Pairwise Relationships Analyzer

A clean, production-ready Python tool that analyzes and visualizes correlation patterns and pairwise relationships in numeric datasets. This project is configured to automatically generate realistic customer metrics with designed relationships, perform Pearson correlation analysis, and generate beautiful, publication-quality visualizations suitable for reports or slide decks.

---

## 🚀 Key Features

*   **Correlation Computation**: Computes standard Pearson correlation coefficients across all numeric dimensions.
*   **Masked Heatmap Visualizations**: Generates professional correlation heatmaps with the upper triangle masked, showing annotated values with high visual readability.
*   **Pairwise Scatter Matrix**: Plots comprehensive pairplots (scatter matrices) using Seaborn, fitted with regression lines and colored by category.
*   **Relationship Summarization**: Automatically extracts and lists the top $N$ strongest positive and negative linear correlations.
*   **Synthetic Data Generation**: Self-contained generation of mock customer metrics (e.g., age, income, spending, savings, visits, debt) with designed covariance matrices.
*   **Interactive Frontend Dashboard**: A completely serverless, beautiful web dashboard to load any CSV, compute correlations dynamically, toggle heatmap styles, and plot interactive scatter plots with regression trendlines.

---

## 📁 Repository Structure

```
Correlation heatmap & pairwise relationships/
├── data/
│   └── sample_data.csv            # Generated synthetic customer dataset (500 records)
├── notebooks/
│   └── exploration.ipynb          # Step-by-step interactive Jupyter notebook
├── output/
│   ├── correlation_heatmap.png    # Masked & annotated heatmap plot
│   └── pairwise_relationships.png  # Pairwise scatter matrix plot (pairplot)
├── src/
│   ├── __init__.py
│   ├── analyzer.py                # Analysis functions (correlations & visualizations)
│   └── generator.py               # Covariance-corrected synthetic data generator
├── index.html                     # [NEW] Interactive Dashboard frontend
├── dashboard.css                  # [NEW] Premium dashboard styling (glassmorphism dark theme)
├── dashboard.js                   # [NEW] Frontend core logic: Pearson calculator & charts
├── main.py                        # Command-line entry point to run full pipeline
├── requirements.txt               # Required Python packages
└── README.md                      # Project documentation
```

---

## 🛠️ Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/correlation-analysis-project.git
    cd "correlation-analysis-project"
    ```

2.  **Create and Activate a Virtual Environment (Optional but Recommended)**:
    *   **Windows**:
        ```bash
        python -m venv venv
        venv\Scripts\activate
        ```
    *   **macOS/Linux**:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

---

## 💻 Usage

### Option 1: Command-Line Interface (CLI)
To run the analysis pipeline and output results directly to your console, run:
```bash
python main.py
```
This script will:
1.  Check for the data (and automatically generate `data/sample_data.csv` if missing).
2.  Compute correlations and display the Pearson correlation matrix.
3.  Summarize top relationships in the terminal.
4.  Generate and save the heatmap and pairplots to the `output/` directory.

### Option 2: Jupyter Notebook
To explore the analysis interactively, run:
```bash
jupyter notebook notebooks/exploration.ipynb
```
Follow the code blocks to inspect the data, tweak parameters, and view the visualizations inline.

### Option 3: Interactive Web Dashboard (No Installation Required!)
We have provided an advanced frontend to explore dataset correlations interactively. Since it runs entirely in the browser, you don't even need a python backend running:
1.  **Open Directly**: Double-click `index.html` to open it in any web browser.
2.  **Using a Local Server (Recommended for local data access)**:
    If you want the dashboard to load local CSVs directly from paths, start a quick local server:
    ```bash
    python -m http.server 8000
    ```
    Then open `http://localhost:8000` in your browser.
3.  **Features**:
    *   **Auto-Loaded Demo**: Click "Load Sample Data" to load the exact covariance-correlated customer dataset instantly.
    *   **Custom CSV Upload**: Drag-and-drop or upload *any* CSV file. It automatically extracts numeric columns and calculates the Pearson correlation matrix on-the-fly.
    *   **Dynamic Heatmap**: Customize color schemes, toggle value annotations, mask the upper triangle, and hover for tooltips showing exact $r$ scores.
    *   **Interactive Scatter Plots**: Choose any $X$ and $Y$ metrics, color points by a categorical field (e.g. `Gender`), and plot a regression trendline instantly.
    *   **Data Table Viewer**: View your raw data in a paginated grid.

---

## 📊 Summary of Sample Output & Insights

From our generated customer dataset, the tool automatically summarizes the top relationships:

### 📈 Strongest Positive Relationships:
1.  **Spending Score $\leftrightarrow$ Monthly Visits** ($r = 0.731$): Customers who visit more frequently have significantly higher spending scores.
2.  **Age $\leftrightarrow$ Years as Member** ($r = 0.664$): Older customers have naturally been members for longer.
3.  **Annual Income $\leftrightarrow$ Savings** ($r = 0.590$): Higher-income customers maintain larger savings accounts.

### 📉 Strongest Negative Relationships:
1.  **Spending Score $\leftrightarrow$ Savings** ($r = -0.434$): Active spenders tend to hold less in savings.
2.  **Savings $\leftrightarrow$ Debt** ($r = -0.325$): Customers with more savings maintain lower debt.
3.  **Savings $\leftrightarrow$ Monthly Visits** ($r = -0.308$): Regular site visitors are more likely to have lower savings.

---

## 🎨 Visualizations

The script outputs high-quality figures in the `output/` directory:

### 1. Masked Correlation Heatmap (`output/correlation_heatmap.png`)
*   Uses a custom diverging colormap (Blue-to-Red) indicating negative-to-positive correlation.
*   The redundant upper triangle is masked out to reduce visual clutter.
*   Annotated with the exact Pearson $r$ values in each cell.

### 2. Pairwise Relationships Plot (`output/pairwise_relationships.png`)
*   Shows scatter plots for combinations of key variables (`Age`, `Annual_Income`, `Spending_Score`, `Savings`).
*   Overlayed with red linear regression lines to show trends.
*   Data points are color-coded by `Gender` to show demographics.
*   The diagonal panels show Kernal Density Estimate (KDE) distributions.
