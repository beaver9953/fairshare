// app/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  CellStyleModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  CellStyleModule,
]);

interface LedgerEntry {
  id: string;
  member: string;
  email: string;
  category: string;
  description: string;
  totalCost: number;
  splitRule: string;
  fairShare: number;
  amountPaid: number;
  balance: number; 
}

const initialData: LedgerEntry[] = [
  { id: "1", member: "Alex", email: "sb-btftl53627589@buyer-persona.example.com", category: "Electricity", description: "October Utility Bill", totalCost: 150.0, splitRule: "Equal (3-way)", fairShare: 50.0, amountPaid: 0.0, balance: 50.0 },
  { id: "2", member: "Beaven", email: "sb-uiepi53520867@business.example.com", category: "Electricity", description: "October Utility Bill", totalCost: 150.0, splitRule: "Equal (3-way)", fairShare: 50.0, amountPaid: 0.0, balance: 50.0 },
  { id: "3", member: "Charlie", email: "sb-sgtbp53274128@personal.example.com", category: "Electricity", description: "October Utility Bill", totalCost: 150.0, splitRule: "Equal (3-way)", fairShare: 50.0, amountPaid: 150.0, balance: -100.0 },
];

export default function FairShareDashboard() {
  const [rowData, setRowData] = useState<LedgerEntry[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [settlementStatus, setSettlementStatus] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const memberBalances = useMemo(() => {
    const balances: Record<string, { email: string; totalBalance: number }> = {};
    rowData.forEach((row) => {
      if (!balances[row.member]) {
        balances[row.member] = { email: row.email, totalBalance: 0 };
      }
      balances[row.member].totalBalance += row.balance;
    });
    return balances;
  }, [rowData]);

  const colDefs: ColDef<LedgerEntry>[] = [
    { field: "member", headerName: "Roommate", flex: 1, minWidth: 100 },
    { field: "category", headerName: "Category", flex: 1, minWidth: 120 },
    { field: "description", headerName: "Description", flex: 2, minWidth: 200 },
    { field: "totalCost", headerName: "Total (£)", flex: 1, minWidth: 100, valueFormatter: (p) => p.value.toFixed(2), filter: "agNumberColumnFilter" },
    { field: "splitRule", headerName: "Split Rule", flex: 1, minWidth: 120 },
    { field: "fairShare", headerName: "Fair Share (£)", flex: 1, minWidth: 120, valueFormatter: (p) => p.value.toFixed(2), filter: "agNumberColumnFilter" },
    { field: "amountPaid", headerName: "Paid (£)", flex: 1, minWidth: 100, valueFormatter: (p) => p.value.toFixed(2), filter: "agNumberColumnFilter" },
    {
      field: "balance", headerName: "Balance (£)", flex: 1, minWidth: 120, filter: "agNumberColumnFilter",
      cellStyle: (params) => {
        if (params.value > 0) return { color: "#dc2626", fontWeight: "bold" };
        if (params.value < 0) return { color: "#16a34a", fontWeight: "bold" };
        return { color: "#6b7280" };
      },
      valueFormatter: (params) => {
        const val = params.value as number;
        if (val > 0) return `+£${val.toFixed(2)}`;
        if (val < 0) return `-£${Math.abs(val).toFixed(2)}`;
        return `£0.00`;
      },
    },
  ];

  // --- ACTIONS ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    setSettlementStatus("AI is reading the document...");

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: reader.result }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        const newEntry: LedgerEntry = {
          id: Date.now().toString(),
          member: "Alex", email: "sb-btftl53627589@buyer-persona.example.com",
          category: data.data.category, description: data.data.description,
          totalCost: data.data.totalCost, splitRule: "Equal (3-way)",
          fairShare: data.data.totalCost / 3, amountPaid: data.data.totalCost,
          balance: (data.data.totalCost / 3) - data.data.totalCost,
        };
        setRowData((prev) => [...prev, newEntry]);
        setSettlementStatus(`Success! Extracted ${data.data.category} for £${data.data.totalCost.toFixed(2)}`);
      } catch (error) {
        setSettlementStatus(`Error: ${error instanceof Error ? error.message : "Failed to process bill"}`);
      } finally {
        setIsExtracting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSettle = async (memberName: string, balance: number) => {
    if (balance <= 0) return;
    const member = memberBalances[memberName];
    setIsLoading(true);
    setSettlementStatus(`Generating PayPal Invoice for ${memberName}...`);

    try {
      const response = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, amount: balance, reason: `FairShare Settlement for ${memberName}` }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSettlementStatus(`Success! Invoice ${data.invoiceId} sent to ${memberName}.`);
    } catch (error) {
      setSettlementStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReimburse = async (memberName: string, balance: number) => {
    if (balance >= 0) return;
    const member = memberBalances[memberName];
    setIsLoading(true);
    setSettlementStatus(`Executing PayPal Payout to ${memberName}...`);

    try {
      const response = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, amount: Math.abs(balance), reason: `FairShare Reimbursement for ${memberName}` }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSettlementStatus(`Success! Payout dispatched to ${memberName}. Batch ID: ${data.payoutBatchId}`);
    } catch (error) {
      setSettlementStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const logInvisibleLabor = (category: string, cost: number, creditHours: number = 0) => {
    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      member: "Charlie", // Charlie is buying things
      email: "sb-sgtbp53274128@personal.example.com",
      category: category,
      description: creditHours > 0 ? `${category} (+ ${creditHours}hrs mental load)` : `Purchased ${category}`,
      totalCost: cost,
      splitRule: "Equal (3-way)",
      fairShare: cost / 3,
      amountPaid: cost,
      balance: (cost / 3) - cost, // Charlie overpaid
    };
    setRowData((prev) => [...prev, newEntry]);
    setSettlementStatus(`Logged: ${category} (£${cost.toFixed(2)})`);
  };

  const simulateIoT = () => {
    // Simulates 5kWh of electricity used by Alex at £0.30/kWh
    const kwh = 5;
    const rate = 0.30;
    const cost = kwh * rate; // £1.50
    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      member: "Alex",
      email: "sb-btftl53627589@buyer-persona.example.com",
      category: "IoT Electricity",
      description: `Smart Plug: ${kwh}kWh @ £${rate}/kWh`,
      totalCost: cost,
      splitRule: "Usage Weighted",
      fairShare: cost, // Alex used it, Alex pays
      amountPaid: 0,
      balance: cost, // Alex owes it
    };
    setRowData((prev) => [...prev, newEntry]);
    setSettlementStatus(`IoT Stream: Logged ${kwh}kWh usage for Alex.`);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & AI Upload */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">FairShare Dashboard</h1>
            <p className="text-gray-500 mt-2">Continuous, usage-aware settlement engine for shared households.</p>
          </div>
          <div>
            <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:bg-gray-400">
              {isExtracting ? "AI Extracting..." : "Upload Bill (AI Extraction)"}
            </button>
          </div>
        </div>

        {/* Quick Actions (Invisible Labor & IoT) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 items-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider mr-2">Low-Friction Logging:</span>
          <button onClick={() => logInvisibleLabor("Groceries", 45.00)} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors">
            + Groceries (£45)
          </button>
          <button onClick={() => logInvisibleLabor("Deep Cleaning", 0, 2)} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors">
            + Mental Load (2 hrs)
          </button>
          <button onClick={simulateIoT} className="px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Simulate IoT Feed
          </button>
        </div>

        {/* Member Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(memberBalances).map(([name, data]) => (
            <div key={name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-500 mb-4">{data.email}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Net Position</p>
                  <p className={`text-2xl font-bold ${data.totalBalance > 0 ? "text-red-600" : data.totalBalance < 0 ? "text-green-600" : "text-gray-600"}`}>
                    {data.totalBalance > 0 ? "+" : ""}£{Math.abs(data.totalBalance).toFixed(2)}
                  </p>
                </div>
                {data.totalBalance > 0 && (
                  <button onClick={() => handleSettle(name, data.totalBalance)} disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Settle (Invoice)
                  </button>
                )}
                {data.totalBalance < 0 && (
                  <button onClick={() => handleReimburse(name, data.totalBalance)} disabled={isLoading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Reimburse (Payout)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status Banner */}
        {settlementStatus && (
          <div className={`p-4 rounded-lg border text-sm font-medium ${
            settlementStatus.startsWith("Success") || settlementStatus.startsWith("Logged") || settlementStatus.startsWith("IoT") ? "bg-green-50 border-green-200 text-green-800" : settlementStatus.startsWith("Error") ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {settlementStatus}
          </div>
        )}

        {/* The Ledger */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">The Fairness Ledger</h2>
            <p className="text-sm text-gray-500">Complete transparency on every calculation and credit.</p>
          </div>
          <div className="ag-theme-quartz w-full" style={{ height: 400 }}>
            <AgGridReact theme="legacy" rowData={rowData} columnDefs={colDefs} defaultColDef={{ sortable: true, filter: true, resizable: true }} />
          </div>
        </div>
      </div>
    </main>
  );
}