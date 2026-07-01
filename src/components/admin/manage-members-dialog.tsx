"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ALL_ROLES } from "@/lib/auth/rbac";
import { toast } from "sonner";

interface WorkspaceMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  created_at: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export function ManageMembersDialog({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("Intern");

  const loadData = useCallback(async () => {
    setFetching(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        fetch(`/api/admin/members?workspaceId=${workspaceId}`),
        fetch("/api/admin/users"),
      ]);

      if (membersRes.ok && usersRes.ok) {
        const membersData = await membersRes.json();
        const usersData = await usersRes.json();
        setMembers(membersData.members || []);
        // Only show active users in the dropdown
        setUsers((usersData.users || []).filter((u: { is_active: boolean }) => u.is_active));
      } else {
        toast.error("Failed to load members or users");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading workspace details");
    } finally {
      setFetching(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        loadData();
        setSelectedUserId("");
        setSelectedRole("Intern");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open, loadData]);

  async function handleAssignMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          userId: selectedUserId,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to assign member");
      }

      toast.success("Workspace membership updated");
      loadData();
      setSelectedUserId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error assigning user");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(membershipId: string) {
    if (!confirm("Are you sure you want to remove this user from the workspace?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/members?id=${membershipId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove member");
      }

      toast.success("Member removed successfully");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error removing user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-1">
          <Users className="h-3.5 w-3.5" /> Manage Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Manage Members — {workspaceName}</DialogTitle>
        </DialogHeader>

        {/* Add/Assign Member Form */}
        <form onSubmit={handleAssignMember} className="mt-4 flex flex-col gap-4 border-b border-border pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select" className="w-full">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-select">Workspace Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" className="gap-1.5" disabled={loading || fetching}>
              <Plus className="h-4 w-4" /> Add / Update Member
            </Button>
          </div>
        </form>

        {/* Members List Table */}
        <div className="flex-1 overflow-y-auto min-h-[200px] mt-4">
          {fetching ? (
            <div className="flex h-full items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No members assigned to this workspace yet.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[80px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-sm">{m.userName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{m.userEmail}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={loading}
                          title="Remove user from workspace"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
