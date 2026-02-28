import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { User, School, GraduationCap, Edit2, Save, X, LogIn, UserPlus, Lock, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { isGuest, getCurrentUserId, getUserAccountById, saveUserAccount } from '../utils/localStorageService';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const guest = isGuest();
  const userId = getCurrentUserId();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [studentClass, setStudentClass] = useState(10);
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const account = userId && userId !== 'guest' ? getUserAccountById(userId) : null;

  useEffect(() => {
    if (account) {
      setName(account.name);
      setSchool(account.school);
      setStudentClass(account.studentClass);
    }
  }, [account?.userId]);

  const handleUpgradeApp = async () => {
    setUpgrading(true);
    toast.info('Checking for updates…');

    try {
      // Tell the waiting service worker to skip waiting and take control
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Force update check
          await registration.update();

          if (registration.waiting) {
            // New SW is waiting — activate it
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            toast.success('Update found! Reloading to apply the latest version…');
            setTimeout(() => window.location.reload(), 1200);
            return;
          }
        }
      }

      // No waiting SW — just do a hard reload to pick up latest cached assets
      toast.success('App is up to date! Reloading…');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error('Could not check for updates. Reloading anyway…');
      setTimeout(() => window.location.reload(), 1200);
    } finally {
      setUpgrading(false);
    }
  };

  if (guest || !userId) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Profile Not Available</h2>
          <p className="text-muted-foreground mb-6">You're in Guest Mode. Create an account to save your profile and data permanently.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate({ to: '/login' })} className="gap-2">
              <LogIn className="w-4 h-4" />Login
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/login' })} className="gap-2">
              <UserPlus className="w-4 h-4" />Register
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Account not found. Please login again.</p>
          <Button onClick={() => navigate({ to: '/login' })} className="mt-4">Go to Login</Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!name.trim() || !school.trim()) {
      toast.error('Name and school cannot be empty');
      return;
    }
    setSaving(true);
    try {
      saveUserAccount({ ...account, name: name.trim(), school: school.trim(), studentClass });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(account.name);
    setSchool(account.school);
    setStudentClass(account.studentClass);
    setEditing(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
            <Edit2 className="w-4 h-4" />Edit
          </Button>
        )}
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
          <span className="text-3xl font-bold text-primary-foreground">
            {account.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username - read only */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />Username
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
              <span className="text-sm font-medium">@{account.username}</span>
              <Lock className="w-3 h-3 text-muted-foreground ml-auto" />
            </div>
            <p className="text-xs text-muted-foreground">Username cannot be changed</p>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="profile-name" className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />Full Name
            </Label>
            {editing ? (
              <Input
                id="profile-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
              />
            ) : (
              <div className="px-3 py-2 bg-muted/50 rounded-md">
                <span className="text-sm">{account.name}</span>
              </div>
            )}
          </div>

          {/* School */}
          <div className="space-y-1">
            <Label htmlFor="profile-school" className="text-xs text-muted-foreground flex items-center gap-1">
              <School className="w-3 h-3" />School
            </Label>
            {editing ? (
              <Input
                id="profile-school"
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="Your school name"
              />
            ) : (
              <div className="px-3 py-2 bg-muted/50 rounded-md">
                <span className="text-sm">{account.school}</span>
              </div>
            )}
          </div>

          {/* Class */}
          <div className="space-y-1">
            <Label htmlFor="profile-class" className="text-xs text-muted-foreground flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />Class
            </Label>
            {editing ? (
              <select
                id="profile-class"
                value={studentClass}
                onChange={e => setStudentClass(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[8, 9, 10, 11, 12].map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-muted/50 rounded-md">
                <span className="text-sm">Class {account.studentClass}</span>
              </div>
            )}
          </div>

          {editing && (
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                {saving ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="w-4 h-4" />Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account stats */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">{new Date(account.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground">{account.userId.slice(0, 16)}...</span>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade App Card */}
      <Card className="mt-4 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            App Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Tap the button below to check for the latest version and reload the app with new features and improvements.
          </p>
          <Button
            onClick={handleUpgradeApp}
            disabled={upgrading}
            variant="default"
            className="w-full gap-2"
          >
            {upgrading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking for updates…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Upgrade App
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This will reload the app to apply any pending updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
