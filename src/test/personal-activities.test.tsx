import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduleView } from "@/components/planner/ScheduleView";
import type { Planner } from "@/lib/use-planner";
import { APPOINTMENT_TYPES, ACTIVITY_TYPES, dateKey, monthHoursByType, type PlannerEvent } from "@/lib/planner";

afterEach(cleanup);
const planner = (events: PlannerEvent[] = []) => ({ events, tasks: [], shopping: [], isLoading: false, isError: false, saveEvents: vi.fn().mockResolvedValue(undefined), saveTasks: vi.fn(), saveShopping: vi.fn(), reload: vi.fn() }) as unknown as Planner;

describe("Personal activities", () => {
  it.each(["lunch", "break", "gym", "prayer", "other"])("supports %s separately from medical work", (type) => {
    expect(ACTIVITY_TYPES.some((item) => item.id === type)).toBe(true);
    expect(APPOINTMENT_TYPES.some((item) => item.id === type)).toBe(false);
  });

  it("saves a lunch activity with its selected time and duration", async () => {
    const p = planner();
    render(<ScheduleView p={p} />);
    fireEvent.click(screen.getByRole("button", { name: "إضافة" }));
    fireEvent.click(screen.getByRole("button", { name: "وقت غداء" }));
    fireEvent.change(screen.getByLabelText("وقت البدء"), { target: { value: "13:00" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() => expect(p.saveEvents).toHaveBeenCalledWith([expect.objectContaining({ type: "lunch", startTime: "13:00", durationMinutes: 60, revenue: 0, sharePercent: 0 })]));
  });

  it("retains a custom activity name and chosen icon when editing", async () => {
    const event: PlannerEvent = { id: "personal-1", date: dateKey(new Date()), startTime: "09:00", durationMinutes: 60, type: "other", activityName: "قراءة", activityIcon: "book", place: "", note: "", clinicName: "", sharePercent: 0, revenue: 0 };
    const p = planner([event]);
    render(<ScheduleView p={p} />);
    fireEvent.click(screen.getByRole("button", { name: /قراءة.*09:00/ }));
    fireEvent.change(screen.getByLabelText("اسم النشاط"), { target: { value: "مشي" } });
    fireEvent.click(screen.getByRole("button", { name: /^مشي$/ }));
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() => expect(p.saveEvents).toHaveBeenCalledWith([expect.objectContaining({ id: "personal-1", type: "other", activityName: "مشي", activityIcon: "walk" })]));
    expect(monthHoursByType([event], new Date()).get("other")).toBe(60);
  });
});