import React from "react";

const toTitle = (str) => {
  const words = str.replace(/([A-Z])/g, " $1").split(" ");
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const TableRenderer = ({ data }) => {
  // const { status, content = {} } = data;

  if (data?.status !== "found") {
    return (
      <div className="p-4 shadow-md rounded-2xl bg-red-800 text-white text-sm">
        <h1 className="text-xl font-bold">Item Not Found</h1>
        <p>No sufficient data to display.</p>
      </div>
    );
  }

  // Destructure with defaults
  const {
    markPrice = "N/A",
    estimatedCurrentMarketPrice = "N/A",
    patrickValuation = "N/A",
    comparables = [],
    appriciationOrDepreciationTrend = "N/A",
    location,
    expertQuote = [],
    specifications = [],

    ...assetDetails
  } = data?.content;

  // Helper to render simple rows
  const renderSimpleRow = (label, val, specialKey) => {
    let valueClass = "text-white";
    if (specialKey === "patrickValuation") valueClass = "text-green-400";
    if (
      specialKey === "markPrice" ||
      specialKey === "estimatedCurrentMarketPrice"
    )
      valueClass = "text-yellow-400";
    return (
      <tr key={specialKey} className="text-xs">
        <td className="py-2 px-1 font-medium bg-gray-900 text-white">
          {label}
        </td>
        <td className={`py-2 px-1 bg-gray-900 ${valueClass}`}>${val}</td>
      </tr>
    );
  };

  return (
    <>
      <div className="text-sm text-white">Location: {location || "N/A"}</div>
      <div className="grid grid-cols-4 gap-[1px]">
        {/* Top Left Panel */}
        <table className=" bg-gray-900 rounded-sm shadow-md overflow-hidden border border-gray-800">
          <thead>
            <tr className="bg-black text-xs">
              {/* <th className="py-2 px-4 text-left text-white">Field</th> */}
              {/* <th className="py-2 px-4 text-left text-white">Value</th> */}
              <th colSpan={2} className="py-2 px-4 text-left text-white">
                Value Analysis
              </th>
            </tr>
          </thead>
          <tbody>
            {renderSimpleRow("Mark Price", markPrice, "markPrice")}
            {renderSimpleRow(
              "Market Price",
              estimatedCurrentMarketPrice,
              "estimatedCurrentMarketPrice"
            )}
            {renderSimpleRow(
              "Patrick Value",
              patrickValuation,
              "patrickValuation"
            )}
          </tbody>
        </table>

        {/* Top Right Panel */}
        {/* <table className="w-full bg-gray-900 rounded-sm shadow-md overflow-hidden border border-gray-800">
        <thead>
          <tr className="bg-black text-xs">
            <th className="py-2 px-4 text-left text-white">Comparables</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4 bg-gray-900 text-xs text-white">
              <ul className="list-none">
                {comparables?.map((item, idx) => (
                  <li key={idx}>{typeof item === 'object' ? item?.model +"- $"+ item?.price : item}</li>
                  ))}
                  </ul>
                  </td>
                  </tr>
                  </tbody>
      </table> */}
        <table className="col-span-3 bg-gray-900 rounded-sm shadow-md overflow-hidden border border-gray-800">
          <thead>
            <tr className="bg-black text-xs">
              <th className="py-2 px-4 text-center text-white" colSpan={2}>
                Specifications
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(specifications || {}).map(([key, val]) => (
              <tr key={key} className="text-[11.5px]">
                <td className="py-1 px-1 font-medium bg-gray-900 text-white">
                  {toTitle(key)}
                </td>
                <td className="py-1 px-1 bg-gray-900 text-white">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="col-span-4 bg-gray-900 rounded-sm shadow-md overflow-hidden border border-gray-800">
          <thead>
            <tr className="bg-black text-xs">
              <th className="py-2 px-4 text-center text-white" colSpan={2}>
                Comparables
              </th>
            </tr>
          </thead>
          <tbody>
            {comparables?.map((item, idx) => (
              <tr key={idx} className="text-[11.5px]">
                <td className="py-1 px-1 font-medium bg-gray-900 text-white">
                  {item?.model}
                </td>
                <td className="py-1 px-1 bg-gray-900 text-white">
                  ${item?.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bottom Left Panel: Asset Details */}
        {/* <table className="w-full col-span-3 bg-gray-900 rounded-sm shadow-md overflow-hidden border border-gray-800">
          <thead>
            <tr className="bg-black text-xs">
              <th className="py-2 px-4 text-left text-white" colSpan={2}>
                Asset Details
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(assetDetails || {}).map(([key, val]) => (
              <tr key={key} className="border-b border-gray-800 text-xs">
                <td className="py-2 px-4 font-medium bg-gray-900 text-white w-1/3">
                  {toTitle(key)}
                </td>
                <td className="py-2 px-4 bg-gray-900 text-white">{val}</td>
              </tr>
            ))}
          </tbody>
        </table> */}

        {/* Bottom Right Panel */}
        {/* <table className="w-full bg-gray-900 rounded-sm shadow-md overflow-hidden border border-gray-800 text-xs">
          <thead>
            <tr className="bg-black">
              <th className="py-2 px-4 text-left text-white">Field</th>
              <th className="py-2 px-4 text-left text-white">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 font-medium bg-gray-900 text-white">
                Appreciation/Depreciation Trend
              </td>
              <td className="py-2 px-4 bg-gray-900 text-white">
                {appriciationOrDepreciationTrend}
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="py-2 px-4 font-medium bg-gray-900 text-white"
              >
                Expert Quote
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="py-2 px-4 bg-gray-900 text-white">
                <blockquote className="italic">
                  "{expertQuote?.[0] || "N/A"}"
                </blockquote>
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="py-2 px-4 font-medium bg-gray-900 text-white"
              >
                Top 5 Accolades
              </td>
            </tr>
          </tbody>
        </table> */}
      </div>
    </>
  );
};

export default TableRenderer;
