import React, { useState, useEffect } from "react";
import { useAgent } from "@/contexts/AgentContext";
import { useCall } from "@/contexts/CallContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Phone, Save, X, Download, LogOut, Lock } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import TimePicker from "@/components/TimePicker";

export default function Home() {
  const { currentAgent, login, logout, isLoading: authLoading } = useAgent();
  const { calls, addCall, updateCall, deleteCall, exportCalls, isLoading: callsLoading } = useCall();

  // Login form state
  const [agentName, setAgentName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Calling form state
  const [patientName, setPatientName] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("12:00");
  const [comment, setComment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"no_answer" | "confirmed" | "redirected" | null>(null);
  const [isInProgress, setIsInProgress] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await login(agentName, isAdmin);
      toast.success(`Welcome, ${agentName}!`);
      setAgentName("");
    } catch (error) {
      toast.error("Login failed");
    }
  };

  const handleStartCall = () => {
    if (!patientName.trim() || !appointmentTime.trim()) {
      toast.error("Please enter patient name and appointment time");
      return;
    }

    if (!currentAgent) {
      toast.error("Agent not authenticated");
      return;
    }

    try {
      addCall({
        patientName,
        appointmentTime,
        agentName: currentAgent.agentName,
        comment: "",
      });
      setIsInProgress(true);
      toast.success("Call started");
    } catch (error) {
      toast.error("Failed to start call");
    }
  };

  const handleSaveCall = async () => {
    if (!isInProgress || !selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      const recentCall = calls[0];
      if (recentCall && recentCall.agentName === currentAgent?.agentName) {
        await updateCall(recentCall.id, {
          status: selectedStatus,
          comment,
        });

        setPatientName("");
        setAppointmentTime("12:00");
        setComment("");
        setSelectedStatus(null);
        setIsInProgress(false);

        toast.success("Call saved successfully");
      }
    } catch (error) {
      toast.error("Failed to save call");
    }
  };

  const handleCancelCall = () => {
    setPatientName("");
    setAppointmentTime("12:00");
    setComment("");
    setSelectedStatus(null);
    setIsInProgress(false);
  };

  const handleDownloadData = async () => {
    try {
      const { csv, fileName } = await exportCalls();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data downloaded successfully");
    } catch (error) {
      toast.error("Failed to download data");
    }
  };

  const handleDeleteCall = async (id: number) => {
    if (!currentAgent?.isAdmin) {
      toast.error("Only admins can delete calls");
      return;
    }
    if (window.confirm("Are you sure you want to delete this call?")) {
      try {
        await deleteCall(id);
        toast.success("Call deleted");
      } catch (error) {
        toast.error("Failed to delete call");
      }
    }
  };

  const handleEditCall = async (id: number) => {
    if (!currentAgent?.isAdmin) {
      toast.error("Only admins can edit calls");
      return;
    }
    const call = calls.find((c) => c.id === id);
    if (call) {
      setEditingId(id);
      setPatientName(call.patientName);
      setAppointmentTime(call.appointmentTime);
      setComment(call.comment || "");
      setSelectedStatus(call.status);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateCall(editingId, {
        patientName,
        appointmentTime,
        comment,
        status: selectedStatus || "no_answer",
      });
      setEditingId(null);
      setPatientName("");
      setAppointmentTime("12:00");
      setComment("");
      setSelectedStatus(null);
      toast.success("Call updated");
    } catch (error) {
      toast.error("Failed to update call");
    }
  };

  // Login screen
  if (!currentAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 p-8 max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <img
              src="https://pura.ai/wp-content/uploads/2025/06/logo.png"
              alt="PURA Logo"
              className="h-12 mx-auto"
            />
            <h1 className="text-3xl font-bold text-cyan-400">PURA</h1>
            <p className="text-sm text-slate-400">Call Center Control Panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Your Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                disabled={authLoading}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="admin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700"
              />
              <label htmlFor="admin" className="text-sm text-slate-300 flex items-center gap-2">
                <Lock size={14} /> Admin Mode
              </label>
            </div>

            <Button
              type="submit"
              disabled={authLoading || !agentName.trim()}
              className="w-full bg-cyan-600 text-white hover:bg-cyan-700 py-3 font-semibold"
            >
              {authLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Demo Mode:</span> Enter any name to get started.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Main interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img src="https://pura.ai/wp-content/uploads/2025/06/logo.png" alt="PURA" className="h-8" />
          <h1 className="text-2xl font-bold text-cyan-400">PURA Call Center</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-400">Agent</p>
            <p className="font-semibold text-white">{currentAgent.agentName}</p>
            {currentAgent.isAdmin && <span className="text-xs text-cyan-400">Admin</span>}
          </div>
          <Button onClick={logout} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calling Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-cyan-400">Calling Panel</h2>
            {isInProgress && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-900/30 border border-red-500/50">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm text-red-400">Call In Progress</span>
              </div>
            )}
          </div>

          {/* Input Section */}
          <Card className="bg-slate-800 border-slate-700 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Patient Name</label>
                <Input
                  type="text"
                  placeholder="Enter patient name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  disabled={isInProgress}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Appointment Time</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isInProgress}
                      className="w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {appointmentTime}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                    <TimePicker value={appointmentTime} onChange={(time) => setAppointmentTime(time)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={handleStartCall}
              disabled={isInProgress || callsLoading}
              className="w-full bg-cyan-600 text-white hover:bg-cyan-700 py-6 text-lg font-semibold flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              Calling on Pura
            </Button>
          </Card>

          {/* Download Button */}
          <Button
            onClick={handleDownloadData}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 py-3 font-semibold flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download All Data
          </Button>

          {/* Status Buttons */}
          {isInProgress && (
            <Card className="bg-slate-800 border-slate-700 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Call Status</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedStatus(selectedStatus === "no_answer" ? null : "no_answer")}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 border ${
                    selectedStatus === "no_answer"
                      ? "bg-red-900/50 border-red-500 text-red-400"
                      : "bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/30"
                  }`}
                >
                  ✕ No Answer
                </button>

                <button
                  onClick={() => setSelectedStatus(selectedStatus === "confirmed" ? null : "confirmed")}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 border ${
                    selectedStatus === "confirmed"
                      ? "bg-green-900/50 border-green-500 text-green-400"
                      : "bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/30"
                  }`}
                >
                  ✓ Confirmed
                </button>

                <button
                  onClick={() => setSelectedStatus(selectedStatus === "redirected" ? null : "redirected")}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 border ${
                    selectedStatus === "redirected"
                      ? "bg-orange-900/50 border-orange-500 text-orange-400"
                      : "bg-orange-900/20 border-orange-500/30 text-orange-400 hover:bg-orange-900/30"
                  }`}
                >
                  → Redirected
                </button>
              </div>
            </Card>
          )}

          {/* Comment Box */}
          {isInProgress && (
            <Card className="bg-slate-800 border-slate-700 p-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wide">Comments</label>
              <Textarea
                placeholder="Add any notes about this call..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[100px]"
              />
            </Card>
          )}

          {/* Action Buttons */}
          {isInProgress && (
            <div className="flex gap-3">
              <Button
                onClick={handleSaveCall}
                className="flex-1 bg-cyan-600 text-white hover:bg-cyan-700 py-3 font-semibold flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Call
              </Button>
              <Button
                onClick={handleCancelCall}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 py-3 font-semibold flex items-center justify-center gap-2"
              >
                <X size={18} />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Patient List */}
        <div className="lg:col-span-5">
          <Card className="bg-slate-800 border-slate-700 h-[calc(100vh-200px)] p-4 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">All Patients</h3>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {calls.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No calls yet</p>
                ) : (
                  calls.map((call) => (
                    <Card
                      key={call.id}
                      className={`bg-slate-700 border p-3 cursor-pointer hover:bg-slate-600 transition-colors ${
                        call.status === "confirmed"
                          ? "border-green-500/50"
                          : call.status === "no_answer"
                            ? "border-red-500/50"
                            : "border-orange-500/50"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-white">{call.patientName}</p>
                            <p className="text-xs text-slate-400">{call.appointmentTime}</p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              call.status === "confirmed"
                                ? "bg-green-900/50 text-green-400"
                                : call.status === "no_answer"
                                  ? "bg-red-900/50 text-red-400"
                                  : "bg-orange-900/50 text-orange-400"
                            }`}
                          >
                            {call.status === "confirmed"
                              ? "✓ Confirmed"
                              : call.status === "no_answer"
                                ? "✕ No Answer"
                                : "→ Redirected"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Agent: {call.agentName}</p>
                        {call.comment && <p className="text-xs text-slate-300">{call.comment}</p>}
                        {currentAgent.isAdmin && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCall(call.id)}
                              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-500 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCall(call.id)}
                              className="flex-1 border-red-600/50 text-red-400 hover:bg-red-900/30 text-xs"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
