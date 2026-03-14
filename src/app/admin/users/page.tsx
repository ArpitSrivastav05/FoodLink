'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/types';
import { Users, Shield, Ban, Search } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filtered, setFiltered] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [blockTarget, setBlockTarget] = useState<AppUser | null>(null);
  const [blocking, setBlocking] = useState(false);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
    setUsers(list);
    setFiltered(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(users);
    } else {
      const term = search.toLowerCase();
      setFiltered(users.filter((u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.includes(term)
      ));
    }
  }, [search, users]);

  const handleToggleBlock = async () => {
    if (!blockTarget) return;
    setBlocking(true);
    try {
      await updateDoc(doc(db, 'users', blockTarget.uid), {
        blocked: !blockTarget.blocked,
      });
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
    setBlockTarget(null);
    setBlocking(false);
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'donor': return 'primary';
      case 'acceptor': return 'info';
      case 'admin': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">User Management</h1>
            <p className="text-sm text-muted mt-1">{users.length} registered users</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">{users.filter((u) => u.role === 'donor').length} Donors</Badge>
            <Badge variant="info">{users.filter((u) => u.role === 'acceptor').length} Acceptors</Badge>
          </div>
        </div>

        <Input
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={16} />}
        />

        {/* User table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold text-muted">Name</th>
                <th className="pb-3 font-semibold text-muted">Email</th>
                <th className="pb-3 font-semibold text-muted">Role</th>
                <th className="pb-3 font-semibold text-muted">Orders</th>
                <th className="pb-3 font-semibold text-muted">Status</th>
                <th className="pb-3 font-semibold text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted">{user.email}</td>
                  <td className="py-3">
                    <Badge variant={roleColor(user.role) as 'primary' | 'info' | 'secondary' | 'default'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3">{user.totalOrders}</td>
                  <td className="py-3">
                    {user.blocked ? (
                      <Badge variant="danger" dot>Blocked</Badge>
                    ) : (
                      <Badge variant="success" dot>Active</Badge>
                    )}
                  </td>
                  <td className="py-3">
                    <Button
                      variant={user.blocked ? 'outline' : 'danger'}
                      size="sm"
                      onClick={() => setBlockTarget(user)}
                      icon={user.blocked ? <Shield size={14} /> : <Ban size={14} />}
                    >
                      {user.blocked ? 'Unblock' : 'Block'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block modal */}
      <Modal open={!!blockTarget} onClose={() => setBlockTarget(null)} title={`${blockTarget?.blocked ? 'Unblock' : 'Block'} User`}>
        <p className="text-sm text-muted mb-4">
          Are you sure you want to {blockTarget?.blocked ? 'unblock' : 'block'}{' '}
          <strong>{blockTarget?.name}</strong> ({blockTarget?.email})?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setBlockTarget(null)}>Cancel</Button>
          <Button
            variant={blockTarget?.blocked ? 'primary' : 'danger'}
            loading={blocking}
            onClick={handleToggleBlock}
          >
            {blockTarget?.blocked ? 'Unblock' : 'Block'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
