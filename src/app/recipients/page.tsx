"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Recipient } from "@/lib/db/types";

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", nickname: "", contact: "", memo: "" });

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch("/api/recipients");
      const data = await res.json();
      setRecipients(data.recipients || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error("이름을 입력하세요");
      return;
    }
    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nickname: form.nickname || null,
          contact: form.contact || null,
          memo: form.memo || null,
        }),
      });
      if (res.ok) {
        toast.success("추가되었습니다");
        setForm({ name: "", nickname: "", contact: "", memo: "" });
        setOpen(false);
        fetchRecipients();
      } else {
        toast.error("추가 실패");
      }
    } catch {
      toast.error("서버 연결 실패");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/recipients?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("삭제되었습니다");
        fetchRecipients();
      }
    } catch {
      toast.error("삭제 실패");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">추천 대상</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            추가
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 추천 대상 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>이름 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label>별칭</Label>
                <Input
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="길동이"
                />
              </div>
              <div className="space-y-2">
                <Label>연락처</Label>
                <Input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="010-1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label>메모</Label>
                <Input
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="메모"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">추가하기</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : recipients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            추천 대상이 없습니다. &quot;추가&quot; 버튼으로 등록하세요.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipients.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>
                    {r.name}
                    {r.nickname && (
                      <span className="text-muted-foreground font-normal ml-2">({r.nickname})</span>
                    )}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-destructive">
                    삭제
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {r.contact && <div>📞 {r.contact}</div>}
                {r.memo && <div>📝 {r.memo}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
