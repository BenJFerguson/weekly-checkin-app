import React, { useState } from "react";
import {
  useGetCheckins,
  useGetCheckinStats,
  useDeleteCheckin,
  useExportCsv,
  getGetCheckinsQueryKey,
  getGetCheckinStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Star, Download, RefreshCw, Trash2, ChevronDown, Wrench, Trophy, Target, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { CheckinWithEvaluations } from "@workspace/api-client-react/src/generated/api.schemas";

const CheckinCard = ({ checkin }: { checkin: CheckinWithEvaluations }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const deleteCheckin = useDeleteCheckin();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteCheckin.mutateAsync({ id: checkin.id });
      queryClient.invalidateQueries({ queryKey: getGetCheckinsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCheckinStatsQueryKey() });
      toast({
        title: "Deleted",
        description: "Check-in removed successfully.",
        className: "bg-pink-50 text-pink-900 border-pink-200",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete check-in.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl shadow-bubbly border border-pink-50 overflow-hidden"
    >
      <div 
        className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-pink-50/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display text-2xl text-pink-600">{checkin.name}</h3>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 text-sm font-bold rounded-full">
              {checkin.department}
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            {format(new Date(checkin.createdAt), "MMMM do, yyyy")}
          </p>
          {!isExpanded && (
            <p className="mt-3 text-foreground line-clamp-2">{checkin.accomplishments}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-pink-400 bg-pink-50 px-3 py-1 rounded-full">
            <Wrench className="w-4 h-4" />
            <span className="font-bold text-sm">{checkin.techEvaluations.length}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-pink-100 text-pink-400"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-red-100 text-red-400"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-pink-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-2xl text-pink-600">Delete Check-in?</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Are you sure you want to delete this check-in? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full border-pink-200">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="rounded-full bg-red-500 hover:bg-red-600 text-white border-none"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-pink-50/50"
          >
            <div className="p-6 bg-pink-50/30 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-display text-xl text-pink-500 flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5" /> Accomplishments
                  </h4>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-pink-100 shadow-sm">{checkin.accomplishments}</p>
                </div>
                <div>
                  <h4 className="font-display text-xl text-pink-500 flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5" /> Goals
                  </h4>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-pink-100 shadow-sm">{checkin.goals}</p>
                </div>
              </div>
              
              {checkin.challenges && (
                <div>
                  <h4 className="font-display text-xl text-pink-500 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5" /> Challenges
                  </h4>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-pink-100 shadow-sm">{checkin.challenges}</p>
                </div>
              )}

              {checkin.techEvaluations.length > 0 && (
                <div>
                  <h4 className="font-display text-2xl text-pink-500 mb-4">Tools Explored</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {checkin.techEvaluations.map((evalItem) => (
                      <div key={evalItem.id} className="bg-white p-5 rounded-xl shadow-sm border border-pink-100 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg text-pink-900">{evalItem.toolName}</span>
                            {evalItem.link && (
                              <a href={evalItem.link} target="_blank" rel="noreferrer" className="text-xs text-pink-500 hover:text-pink-600 hover:underline">
                                (Link)
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{evalItem.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 self-start md:self-auto bg-pink-50 px-3 py-2 rounded-full">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= evalItem.rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-pink-200"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetCheckinStats({ query: { queryKey: getGetCheckinStatsQueryKey() } });
  const { data: checkins, isLoading: checkinsLoading, refetch } = useGetCheckins({ query: { queryKey: getGetCheckinsQueryKey() } });
  const { refetch: fetchCsv } = useExportCsv({ query: { queryKey: ["export-csv"], enabled: false } });

  const handleExport = async () => {
    try {
      const result = await fetchCsv();
      if (result.data) {
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `checkins-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  if (statsLoading || checkinsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="text-pink-500 font-display text-xl animate-pulse">Loading happiness...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-bubbly text-center border border-pink-50">
            <p className="text-4xl font-display text-gradient mb-2">{stats.totalCheckins}</p>
            <p className="text-sm font-bold text-pink-800 uppercase tracking-wider">Submissions</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-bubbly text-center border border-pink-50">
            <p className="text-4xl font-display text-gradient mb-2">{stats.totalToolsEvaluated}</p>
            <p className="text-sm font-bold text-pink-800 uppercase tracking-wider">Tools Explored</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-bubbly text-center border border-pink-50">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-4xl font-display text-gradient">{stats.averageRating.toFixed(1)}</span>
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400 -mt-2" />
            </div>
            <p className="text-sm font-bold text-pink-800 uppercase tracking-wider">Avg Rating</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-bubbly border border-pink-50 flex flex-col justify-center">
            <p className="text-sm font-bold text-pink-800 uppercase tracking-wider text-center mb-3">Top Tools</p>
            <div className="space-y-2">
              {stats.topTools.slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground truncate max-w-[100px]" title={t.toolName}>{t.toolName}</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-bold">{t.count}x</span>
                </div>
              ))}
              {stats.topTools.length === 0 && <p className="text-xs text-center text-muted-foreground">None yet!</p>}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-pink-50">
        <h2 className="font-display text-2xl text-pink-500">Recent Updates</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 bg-white shadow-sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            className="rounded-full bg-gradient-bubbly text-white border-none shadow-bubbly hover:shadow-bubbly-hover transition-transform hover:scale-105"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Checkins List */}
      <div className="space-y-4">
        {checkins?.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-pink-50 shadow-sm">
            <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-12 h-12 text-pink-400" />
            </div>
            <h3 className="font-display text-2xl text-pink-600 mb-2">It's quiet here...</h3>
            <p className="text-muted-foreground text-lg">Be the first to share an update this week!</p>
          </div>
        ) : (
          checkins?.map((checkin) => (
            <CheckinCard key={checkin.id} checkin={checkin} />
          ))
        )}
      </div>
    </div>
  );
}
