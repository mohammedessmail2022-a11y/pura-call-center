import React, { useState, useEffect, useMemo } from "react";
import { useAgent } from "@/contexts/AgentContext";
import { useCall } from "@/contexts/CallContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Phone, Save, X, Download, LogOut, Lock, Search, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimePicker from "@/components/TimePicker";
import { CLINICS, ADMIN_NAMES } from "../../../shared/constants";

export default function Home() {
  const { currentAgent, login, logout, isLoading: authLoading } = useAgent();
  const { calls, addCall, updateCall, deleteCall, exportCalls, refreshCalls, isLoading: callsLoading } = useCall();

  // Login form state
  const [agentName, setAgentName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Calling form state
  const [patientName, setPatientName] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [clinic, setClinic] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("12:00");
  const [comment, setComment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"no_answer" | "confirmed" | "redirected" | null>(null);
  const [isInProgress, setIsInProgress] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Check if user is trying to login as admin
    const requestedAdmin = isAdmin;
    const isValidAdmin = ADMIN_NAMES.includes(agentName);

    if (requestedAdmin && !isValidAdmin) {
      toast.error("Only Chandan and Esmail can access Admin mode");
      return;
    }

    try {
      await login(agentName, requestedAdmin && isValidAdmin);
      toast.success(`Welcome, ${agentName}!`);
      setAgentName("");
      setIsAdmin(false);
    } catch (error) {
      toast.error("Login failed");
    }
  };

  const handleStartCall = async () => {
    if (!patientName.trim() || !appointmentId.trim() || !clinic || !appointmentTime.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!currentAgent) {
      toast.error("Agent not authenticated");
      return;
    }

    try {
      await addCall({
        patientName,
        appointmentId,
        clinic,
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
        setAppointmentId("");
        setClinic("");
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
    setAppointmentId("");
    setClinic("");
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

  const handleStartNewDay = async () => {
    try {
      await refreshCalls();
      toast.success("Data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
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
      setAppointmentId(call.appointmentId);
      setClinic(call.clinic);
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
        appointmentId,
        clinic,
        appointmentTime,
        comment,
        status: selectedStatus || "no_answer",
      });
      setEditingId(null);
      setPatientName("");
      setAppointmentId("");
      setClinic("");
      setAppointmentTime("12:00");
      setComment("");
      setSelectedStatus(null);
      toast.success("Call updated");
    } catch (error) {
      toast.error("Failed to update call");
    }
  };

  // Filter calls based on search query
  const filteredCalls = useMemo(() => {
    if (!searchQuery.trim()) return calls;
    const query = searchQuery.toLowerCase();
    return calls.filter(
      (call) =>
        call.patientName.toLowerCase().includes(query) ||
        call.appointmentId.toLowerCase().includes(query) ||
        call.clinic.toLowerCase().includes(query) ||
        call.appointmentTime.toLowerCase().includes(query)
    );
  }, [calls, searchQuery]);

  // Calculate agent statistics
  const agentStats = useMemo(() => {
    const stats: Record<string, { total: number; confirmed: number; noAnswer: number; redirected: number }> = {};
    calls.forEach((call) => {
      if (!stats[call.agentName]) {
        stats[call.agentName] = { total: 0, confirmed: 0, noAnswer: 0, redirected: 0 };
      }
      stats[call.agentName].total++;
      if (call.status === "confirmed") stats[call.agentName].confirmed++;
      if (call.status === "no_answer") stats[call.agentName].noAnswer++;
      if (call.status === "redirected") stats[call.agentName].redirected++;
    });
    return stats;
  }, [calls]);

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
        </Card>
      </div>
    );
  }

  // Admin Dashboard View
  if (showAdminDashboard && currentAgent.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="https://pura.ai/wp-content/uploads/2025/06/logo.png" alt="PURA" className="h-8" />
            <h1 className="text-2xl font-bold text-cyan-400">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowAdminDashboard(false)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Back to Calling Panel
            </Button>
            <Button onClick={logout} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Agent Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(agentStats).map(([agentName, stats]) => (
            <Card key={agentName} className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">{agentName}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Calls:</span>
                  <span className="text-white font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Confirmed:</span>
                  <span className="text-white font-semibold">{stats.confirmed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">No Answer:</span>
                  <span className="text-white font-semibold">{stats.noAnswer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-400">Redirected:</span>
                  <span className="text-white font-semibold">{stats.redirected}</span>
                </div>
                <div className="pt-2 border-t border-slate-700 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Success Rate:</span>
                    <span className="text-cyan-400 font-semibold">
                      {stats.total > 0 ? ((stats.confirmed / stats.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* All Calls List */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-cyan-400 mb-4">All Calls</h3>
          <ScrollArea className="h-[400px]">
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
                          <p className="text-xs text-slate-400">ID: {call.appointmentId}</p>
                          <p className="text-xs text-slate-400">{call.clinic}</p>
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
                      <p className="text-xs text-slate-400">{call.appointmentTime}</p>
                      {call.comment && <p className="text-xs text-slate-300">{call.comment}</p>}
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
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
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
          {currentAgent.isAdmin && (
            <Button
              onClick={() => setShowAdminDashboard(true)}
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30"
            >
              <BarChart3 size={16} className="mr-2" />
              Dashboard
            </Button>
          )}
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
                <label className="block text-sm font-medium text-slate-200 mb-2">Appointment ID</label>
                <Input
                  type="text"
                  placeholder="Enter appointment ID"
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  disabled={isInProgress}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Clinic</label>
                <Select value={clinic} onValueChange={setClinic} disabled={isInProgress}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CLINICS.map((clinicName: string) => (
                      <SelectItem key={clinicName} value={clinicName} className="text-white">
                        {clinicName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownloadData}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 py-3 font-semibold flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download Data
            </Button>
            <Button
              onClick={handleStartNewDay}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 py-3 font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Start New Day
            </Button>
          </div>

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

          {/* Save/Cancel Buttons */}
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

            {/* Search Bar */}
            <div className="mb-4 relative">
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, ID, clinic, or time..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 pl-10"
              />
            </div>

            {/* Patient List with Scrolling */}
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {filteredCalls.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">
                    {searchQuery ? "No patients found" : "No calls yet"}
                  </p>
                ) : (
                  filteredCalls.map((call) => (
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
                          <div className="flex-1">
                            <p className="font-semibold text-white">{call.patientName}</p>
                            <p className="text-xs text-slate-400">ID: {call.appointmentId}</p>
                            <p className="text-xs text-slate-400">{call.clinic}</p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ml-2 ${
                              call.status === "confirmed"
                                ? "bg-green-900/50 text-green-400"
                                : call.status === "no_answer"
                                  ? "bg-red-900/50 text-red-400"
                                  : "bg-orange-900/50 text-orange-400"
                            }`}
                          >
                            {call.status === "confirmed"
                              ? "✓"
                              : call.status === "no_answer"
                                ? "✕"
                                : "→"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          <span className="font-semibold">{call.appointmentTime}</span> • {call.agentName}
                        </p>
                        {call.comment && <p className="text-xs text-slate-300 italic">{call.comment}</p>}
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
