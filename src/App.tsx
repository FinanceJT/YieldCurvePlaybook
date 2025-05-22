import React, { useState } from "react";
import "./styles.css";

// Updated data models with 20-year point and standard maturities
const SCENARIOS = [
  {
    name: "1980 Volcker Shock",
    yields: { 2: +2.0, 5: +5.5, 10: +8.0, 20: +9.0, 30: +9.5 },
    description: `In 1979-1980, Fed Chairman Paul Volcker dramatically raised interest rates to combat inflation that had reached double digits. Short-term rates were pushed above 20%, with long-term rates following higher. This steep and deliberate tightening created a dramatic bear steepener, with long-term yields rising even more than short-term yields as investors demanded higher compensation for future inflation risk. The aggressive policy successfully broke the back of inflation but triggered a severe recession, with unemployment reaching nearly 11%.`,
    marketImpact:
      "Stocks crashed, bonds suffered historic losses, and a severe recession followed. Housing and auto sales collapsed as financing costs skyrocketed.",
  },
  {
    name: "2008 Financial Crisis",
    yields: { 2: -3.5, 5: -2.5, 10: -1.5, 20: -0.8, 30: -0.5 },
    description: `During the 2008 Financial Crisis, the Federal Reserve slashed interest rates from 5.25% to near-zero in just over a year as the housing market collapsed and financial institutions faced existential threats. The yield curve became dramatically steeper (a "bull steepener") as short-term rates fell much more rapidly than long-term rates. This pattern reflects the Fed's aggressive monetary easing and investors' flight to safety in short-term instruments, while longer-term yields remained higher due to concerns about future inflation and massive government borrowing.`,
    marketImpact:
      "Equities lost over 50% of their value, credit markets froze, and unemployment soared to 10%. Treasury bonds, particularly short-duration, were one of the few assets to deliver positive returns as investors sought safety.",
  },
  {
    name: "Bull Steepener",
    yields: { 2: -0.5, 5: -0.3, 10: -0.1, 20: 0.0, 30: +0.1 },
    description: `A bull steepener occurs when short-term rates fall faster than long-term rates, often at the beginning of economic downturns when the central bank starts cutting rates aggressively to stimulate growth. Short-term yields decline sharply in response to actual or expected rate cuts, while long-term yields fall less or even rise slightly as investors anticipate future economic recovery and potential inflation. This pattern appeared during the early phases of the 2001 and 2008 recessions as the Fed began easing policy.`,
    marketImpact:
      "Short-duration bonds perform well, while stocks often struggle as economic concerns mount. Financial companies typically underperform as their lending margins compress.",
  },
  {
    name: "Bear Flattener",
    yields: { 2: +1.0, 5: +0.8, 10: +0.5, 20: +0.3, 30: +0.2 },
    description: `A bear flattener typically happens during the late cycle of economic expansion when the central bank is hiking interest rates to prevent overheating and inflation. Short-term yields rise faster than long-term yields as the market prices in tightening monetary policy. The flattening occurs because long-term rates rise less, reflecting expectations that higher short-term rates will eventually slow economic growth and possibly lead to a recession. This pattern was seen in 2004-2006 and 2017-2018 during Fed tightening cycles.`,
    marketImpact:
      "Growth stocks typically underperform, banks may benefit from higher net interest margins, and consumer discretionary sectors struggle as borrowing costs increase.",
  },
];

// Updated portfolios with 8-year durations
const PORTFOLIOS = [
  {
    id: "short",
    name: "Short Duration (2 yrs)",
    allocations: { 2: 1.0 },
    description:
      "This portfolio focuses entirely on short-term bonds, minimizing interest rate risk but typically accepting lower yields. It's most vulnerable to Fed policy changes and short-term rate movements.",
  },
  {
    id: "long",
    name: "Long Duration (15 yrs)",
    allocations: { 10: 0.5, 20: 0.5 },
    description:
      "This portfolio combines intermediate and long-term bonds, maximizing yield potential with significant interest rate risk. It's sensitive to changes in growth and inflation expectations.",
  },
  {
    id: "barbell",
    name: "Barbell (8 yrs)",
    allocations: { 2: 0.67, 20: 0.33 },
    description:
      "The barbell strategy combines short and long-term bonds while avoiding intermediate maturities. This approach aims to capture higher yields from long bonds while maintaining liquidity and reinvestment flexibility through short bonds.",
  },
  {
    id: "ladder",
    name: "Ladder (8 yrs)",
    allocations: { 2: 0.36, 5: 0.27, 10: 0.2, 20: 0.13, 30: 0.04 },
    description:
      "The ladder strategy distributes investments across maturities with higher allocations to shorter-term bonds. This approach provides regular reinvestment opportunities while capturing some yield benefit from longer maturities.",
  },
];

// Calculate price change for a given yield change and duration
function calculatePriceChange(yieldChange, duration) {
  const yieldChangeFraction = yieldChange / 100; // Convert percentage to decimal
  return (Math.pow(1 / (1 + yieldChangeFraction), duration) - 1) * 100; // Convert to percentage
}

// Get price impact for each duration in the scenario
function getScenarioPriceImpacts(scenario) {
  const impacts = {};
  Object.entries(scenario.yields).forEach(([duration, change]) => {
    impacts[duration] = calculatePriceChange(change, Number(duration));
  });
  return impacts;
}

// Compute weighted P/L across the portfolio
function computePortfolioPL(portfolio, scenario) {
  let totalPL = 0;
  const durations = Object.keys(scenario.yields)
    .map(Number)
    .sort((a, b) => a - b);

  // For each allocation, calculate the P/L and add to total
  Object.entries(portfolio.allocations).forEach(([dur, weight]) => {
    const duration = Number(dur);
    let yieldChange = 0;

    if (durations.includes(duration)) {
      yieldChange = scenario.yields[duration];
    } else {
      // Interpolate
      const lower = durations.filter((d) => d < duration).pop();
      const upper = durations.filter((d) => d > duration).shift();

      if (lower !== undefined && upper !== undefined) {
        const lowerYield = scenario.yields[lower];
        const upperYield = scenario.yields[upper];
        const ratio = (duration - lower) / (upper - lower);
        yieldChange = lowerYield + ratio * (upperYield - lowerYield);
      } else if (lower !== undefined) {
        yieldChange = scenario.yields[lower];
      } else if (upper !== undefined) {
        yieldChange = scenario.yields[upper];
      }
    }

    // Use the bond price formula
    const priceChange = calculatePriceChange(yieldChange, duration);
    totalPL += priceChange * weight; // Add weighted price change to total
  });

  return totalPL; // Total portfolio P/L in percentage terms
}

export default function App() {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [portfolio, setPortfolio] = useState(PORTFOLIOS[0]);
  const [showScenarioInfo, setShowScenarioInfo] = useState(true);
  const [showPortfolioInfo, setShowPortfolioInfo] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const allocationData = Object.entries(portfolio.allocations).map(
    ([dur, weight]) => ({
      duration: Number(dur),
      weight: weight * 100, // Convert to percentage
    })
  );

  // Get P/L impacts for each standard duration (not weighted by portfolio)
  const priceImpacts = getScenarioPriceImpacts(scenario);
  const plData = Object.entries(priceImpacts).map(([duration, impact]) => ({
    duration: Number(duration),
    pl: impact,
  }));

  // Calculate total portfolio P/L (weighted sum of all duration impacts)
  const totalPL = computePortfolioPL(portfolio, scenario);

  // Calculate dollar impact correctly - percentage of $10M
  const totalDollarImpact = (totalPL / 100) * 10000000; // Convert percentage to decimal, then multiply by $10M

  // Dynamic scaling functions
  const getScaleFactor = (data, valueKey, minPercent = 50) => {
    const maxVal = Math.max(...data.map((item) => Math.abs(item[valueKey])));
    if (maxVal === 0) return 1; // Avoid division by zero

    // If max value is small, increase scale factor to make bars more visible
    if (maxVal < minPercent) {
      return minPercent / maxVal;
    }
    return 1;
  };

  const allocationScaleFactor = getScaleFactor(allocationData, "weight", 50);
  const plScaleFactor = getScaleFactor(plData, "pl", 30);

  // Function to calculate width percentage for allocation bars (0-100% scale, centered)
  const getAllocationWidth = (value) => {
    return `${(value * allocationScaleFactor) / 2}%`; // Half of the percentage (since we're centering)
  };

  // Function to calculate width percentage for P/L bars (-100% to 100% scale)
  const getPLWidth = (value) => {
    return `${Math.min(Math.abs(value) * plScaleFactor, 100) / 2}%`; // Divide by 2 for center based layout
  };

  // Function to calculate width percentage for total impact bar (-$10M to +$10M scale)
  const getTotalImpactWidth = (value) => {
    // Convert to millions and cap at 10M (100%)
    const valueInMillions = value / 1000000;
    const scaleFactor = Math.abs(valueInMillions) < 1 ? 20 : 5; // Increase scaling for small values
    return `${Math.min(Math.abs(valueInMillions) * scaleFactor, 50)}%`; // Cap at 50% for half width
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Yield Curve Playbook</h1>
          <p style={styles.subtitle}>Mariemont Capital</p>
        </div>
      </header>

      <main style={styles.main}>
        {showDisclaimer && (
          <div style={styles.disclaimerBanner}>
            <div style={styles.disclaimerContent}>
              <p style={styles.disclaimerText}>
                <strong>Important Disclosure:</strong> This content is for
                educational and informational purposes only and does not
                constitute investment advice, an offer to sell, or a
                solicitation of an offer to buy any security. Any such offer or
                solicitation will be made only by means of confidential offering
                documents to qualified investors in accordance with applicable
                securities laws.
              </p>
              <button
                style={styles.dismissButton}
                onClick={() => setShowDisclaimer(false)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Select Yield Curve Scenario:
                <div style={styles.selectContainer}>
                  <select
                    style={styles.select}
                    value={scenario.name}
                    onChange={(e) => {
                      const selected = SCENARIOS.find(
                        (s) => s.name === e.target.value
                      );
                      if (selected) {
                        setScenario(selected);
                        setShowScenarioInfo(true);
                      }
                    }}
                  >
                    {SCENARIOS.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            {showScenarioInfo ? (
              <div style={styles.infoCard}>
                <div style={styles.infoCardHeader}>
                  <h3 style={styles.infoCardTitle}>
                    {scenario.name}: Historical Context
                  </h3>
                  <button
                    style={styles.closeButton}
                    onClick={() => setShowScenarioInfo(false)}
                  >
                    Show Less
                  </button>
                </div>
                <p style={styles.infoCardDescription}>{scenario.description}</p>
                <h4 style={styles.infoCardSubtitle}>Market Impact</h4>
                <p style={styles.infoCardDescription}>
                  {scenario.marketImpact}
                </p>
                <div style={styles.yieldTable}>
                  <h4 style={styles.infoCardSubtitle}>
                    Yield Curve Shifts & Price Impact
                  </h4>
                  <div style={styles.compactTableContainer}>
                    <table style={styles.compactTable}>
                      <thead>
                        <tr>
                          <th style={styles.compactTableHeader}>Maturity</th>
                          <th style={styles.compactTableHeader}>
                            Yield Change
                          </th>
                          <th style={styles.compactTableHeader}>
                            Price Impact
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(scenario.yields).map(
                          ([duration, change]) => {
                            const dur = Number(duration);
                            const priceChange = calculatePriceChange(
                              change,
                              dur
                            );
                            return (
                              <tr key={duration}>
                                <td style={styles.compactTableCell}>
                                  {duration} Year
                                </td>
                                <td
                                  style={{
                                    ...styles.compactTableCell,
                                    color: change >= 0 ? "#e74c3c" : "#27ae60",
                                  }}
                                >
                                  {change > 0 ? "+" : ""}
                                  {change.toFixed(2)}%
                                </td>
                                <td
                                  style={{
                                    ...styles.compactTableCell,
                                    color:
                                      priceChange >= 0 ? "#27ae60" : "#e74c3c",
                                  }}
                                >
                                  {priceChange > 0 ? "+" : ""}
                                  {priceChange.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.showMoreContainer}>
                <button
                  style={styles.showMoreButton}
                  onClick={() => setShowScenarioInfo(true)}
                >
                  Show Scenario Details
                </button>
              </div>
            )}

            <div style={styles.formGroup}>
              <div style={styles.labelWithInfo}>
                <p style={styles.label}>Select Portfolio Structure:</p>
              </div>
              <div style={styles.radioGroup}>
                {PORTFOLIOS.map((p) => (
                  <label key={p.id} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="portfolio"
                      checked={portfolio.id === p.id}
                      onChange={() => {
                        setPortfolio(p);
                        setShowPortfolioInfo(true);
                      }}
                      style={styles.radio}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {showPortfolioInfo ? (
              <div style={styles.infoCard}>
                <div style={styles.infoCardHeader}>
                  <h3 style={styles.infoCardTitle}>{portfolio.name}</h3>
                  <button
                    style={styles.closeButton}
                    onClick={() => setShowPortfolioInfo(false)}
                  >
                    Show Less
                  </button>
                </div>
                <p style={styles.infoCardDescription}>
                  {portfolio.description}
                </p>

                <h4 style={styles.infoCardSubtitle}>
                  Portfolio Characteristics
                </h4>
                <ul style={styles.infoList}>
                  {portfolio.id === "short" && (
                    <>
                      <li>
                        Lower yield potential but minimal interest rate risk
                      </li>
                      <li>Most effective during rising rate environments</li>
                      <li>Less sensitive to long-term economic forecasts</li>
                      <li>Provides frequent reinvestment opportunities</li>
                    </>
                  )}
                  {portfolio.id === "long" && (
                    <>
                      <li>
                        Higher yield potential with significant interest rate
                        risk
                      </li>
                      <li>Most effective during falling rate environments</li>
                      <li>Balance of intermediate and long-term exposure</li>
                      <li>
                        Good potential for capital appreciation in economic
                        downturns
                      </li>
                    </>
                  )}
                  {portfolio.id === "barbell" && (
                    <>
                      <li>
                        Combines attributes of both short and long portfolios
                      </li>
                      <li>More effective in non-parallel yield curve shifts</li>
                      <li>67% in 2-year bonds, 33% in 20-year bonds</li>
                      <li>
                        Avoids intermediate maturities most affected by Fed
                        policy uncertainty
                      </li>
                    </>
                  )}
                  {portfolio.id === "ladder" && (
                    <>
                      <li>
                        Higher allocations to shorter maturities (36% in 2-year,
                        27% in 5-year)
                      </li>
                      <li>
                        Moderate allocation to intermediate term (20% in
                        10-year)
                      </li>
                      <li>
                        Small allocations to long end (13% in 20-year, 4% in
                        30-year)
                      </li>
                      <li>
                        Balance of liquidity, income, and modest term premium
                      </li>
                    </>
                  )}
                </ul>
              </div>
            ) : (
              <div style={styles.showMoreContainer}>
                <button
                  style={styles.showMoreButton}
                  onClick={() => setShowPortfolioInfo(true)}
                >
                  Show Portfolio Details
                </button>
              </div>
            )}
          </div>

          <div style={styles.chartsContainer}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Portfolio Allocation</h3>
              <div style={styles.chart}>
                {allocationData.map((item, i) => {
                  const width = getAllocationWidth(item.weight);
                  return (
                    <div key={i} style={styles.barContainer}>
                      <div style={styles.barLabel}>{item.duration}yr</div>
                      <div style={styles.barBackground}>
                        <div
                          style={{
                            ...styles.allocationBar,
                            width: width,
                            marginLeft: "50%",
                          }}
                        />
                        <div style={styles.zeroLine}></div>
                        <span
                          style={{
                            ...styles.barValue,
                            color: "#999999",
                            fontWeight: "bold",
                          }}
                        >
                          {item.weight.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Expected P/L Impact by Duration</h3>
              <div style={styles.chart}>
                {plData.map((item, i) => {
                  const width = getPLWidth(item.pl);
                  return (
                    <div key={i} style={styles.barContainer}>
                      <div style={styles.barLabel}>{item.duration}yr</div>
                      <div style={styles.barBackground}>
                        <div
                          style={{
                            ...styles.plBar,
                            backgroundColor:
                              item.pl >= 0 ? "#25AAE1" : "#e74c3c",
                            width: width,
                            marginLeft: item.pl >= 0 ? "50%" : "auto",
                            marginRight: item.pl < 0 ? "50%" : "auto",
                          }}
                        />
                        <div style={styles.zeroLine}></div>
                        <span
                          style={{
                            ...styles.barValue,
                            color: "#999999",
                            fontWeight: "bold",
                          }}
                        >
                          {item.pl >= 0 ? "+" : ""}
                          {item.pl.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={styles.chartNote}>
                Shows price impact for each duration point, independent of
                portfolio allocation.
              </div>
            </div>
          </div>

          {/* Total Impact Chart with corrected calculation */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>
              Total Impact on $10,000,000 Portfolio
            </h3>
            <div style={{ ...styles.chart, height: "80px", marginTop: "10px" }}>
              <div style={styles.totalBarContainer}>
                <div style={styles.totalBarBackground}>
                  <div
                    style={{
                      ...styles.totalBar,
                      backgroundColor: totalPL >= 0 ? "#25AAE1" : "#e74c3c", // Using same blue as P/L chart
                      width: getTotalImpactWidth(totalDollarImpact),
                      marginLeft: totalPL >= 0 ? "50%" : "auto",
                      marginRight: totalPL < 0 ? "50%" : "auto",
                    }}
                  />
                  <div style={styles.zeroLine}></div>
                  <span
                    style={{
                      ...styles.totalBarValue,
                      color: "#999999",
                      fontWeight: "bold",
                    }}
                  >
                    {totalPL >= 0 ? "+" : "-"}$
                    {Math.abs(totalDollarImpact).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.summary}>
            <h3 style={styles.summaryTitle}>Portfolio Impact Summary</h3>
            <p style={styles.summaryText}>
              Under the <strong>{scenario.name}</strong> scenario, the{" "}
              <strong>{portfolio.name}</strong> portfolio would
              <span
                style={{
                  ...styles.summaryHighlight,
                  color: totalPL >= 0 ? "#25AAE1" : "#e74c3c", // Using same blue as chart
                }}
              >
                {totalPL >= 0 ? " gain " : " lose "}
                {Math.abs(totalPL).toFixed(2)}%
              </span>{" "}
              in value.
            </p>
            <p style={styles.disclaimer}>
              This estimate is based on the bond pricing formula P/P =
              (1/(1+ΔY))^Duration - 1, which provides a more accurate price
              change estimate for large yield movements than the traditional
              duration approximation.
            </p>
            <div style={styles.educationalNote}>
              <h4 style={styles.educationalNoteTitle}>What This Means</h4>
              <p style={styles.educationalNoteText}>
                {totalPL < -20 ? (
                  <>
                    This is a <strong>severe loss</strong> that would
                    significantly impact portfolio value. Such losses occurred
                    during major interest rate shocks like the Volcker era.
                    Investors in longer duration bonds experienced historic
                    losses as rates rose dramatically.
                  </>
                ) : totalPL < -10 ? (
                  <>
                    This represents a <strong>substantial loss</strong> for a
                    fixed income portfolio. Such a loss would be considered a
                    major drawdown, comparable to what investors experienced
                    during significant rate hiking cycles.
                  </>
                ) : totalPL < -5 ? (
                  <>
                    This is a <strong>moderate loss</strong> for a fixed income
                    portfolio, typical during periods of rising interest rates.
                    Most bond investors would feel this impact, though it's
                    within historical norms for rate adjustment periods.
                  </>
                ) : totalPL < 0 ? (
                  <>
                    This represents a <strong>mild loss</strong> that is quite
                    common during minor interest rate adjustments. Most bond
                    investors experience such losses periodically as part of
                    normal market cycles.
                  </>
                ) : totalPL < 5 ? (
                  <>
                    This <strong>modest gain</strong> represents the typical
                    benefit bonds receive during mild interest rate declines.
                    Such performance is common when central banks begin easing
                    monetary policy.
                  </>
                ) : totalPL < 10 ? (
                  <>
                    This <strong>solid gain</strong> is representative of bond
                    performance during pronounced interest rate declines, such
                    as during economic slowdowns when central banks cut rates
                    significantly.
                  </>
                ) : (
                  <>
                    This <strong>substantial gain</strong> represents the kind
                    of performance bonds achieve during major bull markets for
                    fixed income, typically during recessions or financial
                    crises when rates are cut dramatically and investors seek
                    safety.
                  </>
                )}
              </p>
            </div>
          </div>

          <div style={styles.legalDisclaimer}>
            <p style={styles.legalText}>
              <strong>Disclaimer:</strong> The information presented in this
              tool is for educational and informational purposes only and does
              not constitute investment advice, an offer to sell, or a
              solicitation of an offer to buy any security. Past performance is
              not indicative of future results. Any investments or strategies
              referenced herein do not take into account the investment
              objectives, financial situation or particular needs of any
              specific person. Investors should consult with a financial
              professional before making any investment decisions.
            </p>
            <p style={styles.legalText}>
              The calculations and scenarios presented are hypothetical and
              based on historical or theoretical yield curve movements. Actual
              market conditions may vary significantly. Investment involves
              risk. The value of investments and any income derived from them
              can go down as well as up and investors may not get back the
              original amount invested.
            </p>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <button style={styles.button}>Contact Us</button>
        <p style={styles.footerText}>
          Mariemont Capital © 2025 | For educational purposes only; not
          investment advice.
        </p>
      </footer>
    </div>
  );
}

// Enhanced styles that don't rely on external CSS
const styles = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    margin: 0,
    padding: 0,
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 1000,
  },
  header: {
    backgroundColor: "#195076",
    color: "white",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    background: "linear-gradient(135deg, #195076 0%, #1a5a80 100%)",
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    margin: "0 0 6px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "16px",
    fontWeight: "normal",
    margin: 0,
    opacity: 0.9,
  },
  main: {
    flex: 1,
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "30px 20px",
    width: "100%",
    boxSizing: "border-box",
  },
  disclaimerBanner: {
    backgroundColor: "#fffde7",
    border: "1px solid #ffd54f",
    borderRadius: "6px",
    padding: "12px 16px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  disclaimerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  disclaimerText: {
    margin: 0,
    fontSize: "14px",
    color: "#5d4037",
    lineHeight: 1.5,
  },
  dismissButton: {
    background: "none",
    border: "none",
    color: "#5d4037",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 0 0 16px",
    flexShrink: 0,
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
    padding: "40px",
    marginBottom: "24px",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  form: {
    marginBottom: "30px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#333",
  },
  labelWithInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  selectContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "6px",
  },
  select: {
    flex: 1,
    padding: "10px 12px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "white",
  },
  infoButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#25AAE1",
    color: "white",
    border: "none",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    flexShrink: 0,
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "6px",
    padding: "20px",
    marginBottom: "20px",
  },
  showMoreContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  showMoreButton: {
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    color: "#195076",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "4px",
    transition: "background-color 0.2s ease",
  },
  infoCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  infoCardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#195076",
    margin: 0,
  },
  infoCardSubtitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    marginTop: "15px",
    marginBottom: "10px",
  },
  infoCardDescription: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#333",
    margin: "0 0 15px 0",
  },
  closeButton: {
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    color: "#333",
    fontSize: "14px",
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "4px",
  },
  // Removed max-height from tableContainer
  compactTableContainer: {
    width: "100%",
  },
  // Created a more compact table style
  compactTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  compactTableHeader: {
    textAlign: "left",
    padding: "6px 10px",
    borderBottom: "2px solid #ddd",
    backgroundColor: "#f1f1f1",
    fontWeight: "600",
  },
  compactTableCell: {
    padding: "4px 10px",
    borderBottom: "1px solid #ddd",
  },
  infoList: {
    fontSize: "14px",
    lineHeight: "1.6",
    paddingLeft: "20px",
    margin: "0",
  },
  radioGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "12px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    cursor: "pointer",
  },
  radio: {
    marginRight: "8px",
  },
  chartsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "30px",
    marginBottom: "30px",
  },
  chartCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    padding: "20px",
    border: "1px solid #e9ecef",
    marginBottom: "20px",
  },
  chartTitle: {
    textAlign: "center",
    color: "#195076",
    fontSize: "18px",
    fontWeight: "600",
    marginTop: 0,
    marginBottom: "20px",
  },
  chartNote: {
    textAlign: "center",
    fontSize: "12px",
    color: "#666",
    marginTop: "10px",
    fontStyle: "italic",
  },
  chart: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  barContainer: {
    display: "flex",
    alignItems: "center",
  },
  barLabel: {
    width: "50px",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "right",
    paddingRight: "12px",
  },
  barBackground: {
    flex: 1,
    height: "30px",
    backgroundColor: "#edf2f7",
    borderRadius: "4px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
  allocationBar: {
    height: "100%",
    backgroundColor: "#195076",
    borderRadius: "4px",
  },
  plBar: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  zeroLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: "1px",
    backgroundColor: "#aaa",
  },
  barValue: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "14px",
  },
  totalBarContainer: {
    padding: "10px 0",
  },
  totalBarBackground: {
    height: "40px",
    backgroundColor: "#edf2f7",
    borderRadius: "4px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
  totalBar: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  totalBarValue: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "16px",
    fontWeight: "bold",
  },
  summary: {
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    padding: "20px",
    border: "1px solid #e9ecef",
  },
  summaryTitle: {
    color: "#195076",
    fontSize: "20px",
    fontWeight: "600",
    marginTop: 0,
    marginBottom: "16px",
  },
  summaryText: {
    fontSize: "16px",
    lineHeight: 1.5,
    marginBottom: "12px",
  },
  summaryHighlight: {
    fontWeight: "bold",
  },
  disclaimer: {
    fontSize: "14px",
    color: "#666",
    marginTop: "12px",
    marginBottom: "20px",
  },
  educationalNote: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderLeft: "4px solid #25AAE1",
    borderRadius: "4px",
    padding: "15px",
    marginTop: "20px",
  },
  educationalNoteTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginTop: 0,
    marginBottom: "10px",
    color: "#333",
  },
  educationalNoteText: {
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
    color: "#333",
  },
  legalDisclaimer: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "6px",
  },
  legalText: {
    fontSize: "12px",
    color: "#666",
    lineHeight: "1.5",
    margin: "0 0 12px 0",
  },
  footer: {
    backgroundColor: "#f1f1f1",
    textAlign: "center",
    padding: "30px 20px",
  },
  button: {
    backgroundColor: "#25AAE1",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "background-color 0.2s ease",
  },
  footerText: {
    fontSize: "12px",
    color: "#666",
    marginTop: "16px",
  },
};
