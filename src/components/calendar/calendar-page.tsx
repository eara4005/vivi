"use client";

import { useState, useEffect, useTransition } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { CalendarEvent } from "@/lib/google-calendar";
import { cn } from "@/lib/utils";

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [isPending, startTransition] = useTransition();

  // In a real app, access token would come from session/auth
  const accessToken = typeof window !== "undefined"
    ? sessionStorage.getItem("google_access_token")
    : null;

  const noToken = !accessToken;

  useEffect(() => {
    if (!accessToken) return;
    const from = startOfMonth(currentMonth).toISOString();
    const to = endOfMonth(currentMonth).toISOString();

    startTransition(async () => {
      try {
        const res = await fetch(`/api/calendar?from=${from}&to=${to}`, {
          headers: { "x-google-access-token": accessToken },
        });
        const data = await res.json();
        if (Array.isArray(data)) setEvents(data);
      } catch {
        // ignore
      }
    });
   
  }, [currentMonth, accessToken]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const dayEvents = events.filter((e) => isSameDay(new Date(e.start), selectedDay));

  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  }
  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur px-4 py-4">
        <h1 className="text-xl font-bold">カレンダー</h1>
      </header>

      {noToken ? (
        <div className="px-4 py-8 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Google Calendarと連携するには認証が必要です。
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            環境変数 GOOGLE_CLIENT_ID / SECRET を設定後、
            <br />
            <code>/api/auth/google-calendar</code> にアクセスしてください。
          </p>
        </div>
      ) : (
        <div className={cn("px-4 py-4", isPending && "opacity-60")}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="rounded-full p-2 hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-semibold">
              {format(currentMonth, "yyyy年M月", { locale: ja })}
            </h2>
            <button onClick={nextMonth} className="rounded-full p-2 hover:bg-muted">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-1">
            {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
              <div key={d} className="py-1 text-center text-xs text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const hasEvents = events.some((e) => isSameDay(new Date(e.start), day));
              const selected = isSameDay(day, selectedDay);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "relative flex h-10 w-full flex-col items-center justify-center rounded-full text-sm transition-colors",
                    selected && "bg-indigo-600 text-white",
                    !selected && isToday(day) && "font-bold text-indigo-600",
                    !selected && !isToday(day) && "hover:bg-muted",
                  )}
                >
                  {format(day, "d")}
                  {hasEvents && (
                    <span
                      className={cn(
                        "absolute bottom-1 h-1 w-1 rounded-full",
                        selected ? "bg-white" : "bg-indigo-500",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Events */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {format(selectedDay, "M月d日(EEE)", { locale: ja })}の予定
            </h3>
            {isPending ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">予定なし</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 px-4 py-3">
      <p className="text-sm font-medium">{event.title}</p>
      {!event.allDay && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {format(new Date(event.start), "HH:mm")} – {format(new Date(event.end), "HH:mm")}
        </p>
      )}
      {event.location && (
        <p className="mt-0.5 text-xs text-muted-foreground">📍 {event.location}</p>
      )}
    </div>
  );
}
