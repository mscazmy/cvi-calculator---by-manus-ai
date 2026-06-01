# Validity Index Research Findings

## 1. Content Validity Ratio (CVR) - Lawshe (1975)
- **Formula**: `CVR = (ne - N/2) / (N/2)`
  - `ne`: Number of experts who rated the item as "Essential"
  - `N`: Total number of experts
- **Rating Scale**: 
  1. Not necessary
  2. Useful but not essential
  3. Essential
- **Thresholds (Lawshe's Table)**:
  - 5 experts: 0.99
  - 6 experts: 0.99
  - 7 experts: 0.99
  - 8 experts: 0.75
  - 9 experts: 0.78
  - 10 experts: 0.62
  - 11 experts: 0.59
  - 12 experts: 0.56
  - 13 experts: 0.54
  - 14 experts: 0.51
  - 15 experts: 0.49
  - 20 experts: 0.42
  - 25 experts: 0.37
  - 30 experts: 0.33
  - 35 experts: 0.31
  - 40 experts: 0.29

## 2. Content Validity Index (CVI)
- **Item-level CVI (I-CVI)**:
  - **Formula**: `I-CVI = (Number of experts rating 3 or 4) / (Total number of experts)`
  - **Rating Scale**: 4-point scale (1: Not relevant, 2: Somewhat relevant, 3: Quite relevant, 4: Highly relevant)
  - **Threshold**: > 0.79 (for 6+ experts), 1.00 (for < 6 experts).
- **Scale-level CVI (S-CVI)**:
  - **S-CVI/Ave (Average)**: Mean of I-CVI values across all items.
  - **S-CVI/UA (Universal Agreement)**: Proportion of items that achieved a CVI of 1.00.

## 3. Face Validity Index (FVI)
- **Item-level FVI (I-FVI)**:
  - **Formula**: Same as I-CVI but based on "Clarity" or "Comprehension".
  - **Rating Scale**: 4-point scale (1: Not clear, 2: Somewhat clear, 3: Quite clear, 4: Highly clear).
  - **Threshold**: > 0.80.
- **Scale-level FVI (S-FVI)**:
  - **S-FVI/Ave**: Mean of I-FVI values across all items.

## Implementation Details
- **Visuals**: Bar charts for I-CVI/I-FVI/CVR per item.
- **Export**: PDF export using `jspdf` and `jspdf-autotable`.
- **Excel/CSV Parsing**: `SheetJS` (xlsx library).
- **Data Template**: Excel file with columns for Item ID, and Expert ratings for CVR, CVI, and FVI.
