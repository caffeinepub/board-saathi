import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { User, School, GraduationCap, Edit2, Save, X, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getStoredUser, storeUser } from '../hooks/useQueries';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const storedUser = getStoredUser();
  const isGuest = !identity && storedUser?.username === 'guest';

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name ?? storedUser?.name ?? '');
  const [school, setSchool] = useState(userProfile?.school ?? '');
  const [studentClass, setStudentClass] = useState(
    userProfile?.studentClass ? Number(userProfile.studentClass) : 10
  );
  const [upgrading, setUpgrading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      if (userProfile && identity) {
        await saveProfile.mutateAsync({
          name: name.trim(),
          username: userProfile.username,
          school: school.trim(),
          studentClass: BigInt(studentClass),
        });
      }
      storeUser({ name: name.trim(), username: storedUser?.username ?? '' });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to save profile');
    }
  };

  const handleCancel = () => {
    setName(userProfile?.name ?? storedUser?.name ?? '');
    setSchool(userProfile?.school ?? '');
    setStudentClass(userProfile?.studentClass ? Number(userProfile.studentClass) : 10);
    setEditing(false);
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const handleUpgradeApp = async () => {
    setUpgrading(true);
    toast.info('Checking for updates…');
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            toast.success('Update found! Reloading…');
            setTimeout(() => window.location.reload(), 1200);
            return;
          }
        }
      }
      toast.success('App is up to date! Reloading…');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error('Could not check for updates. Reloading anyway…');
      setTimeout(() => window.location.reload(), 1200);
    } finally {
      setUpgrading(false);
    }
  };

  if (isGuest) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Profile Not Available</h2>
          <p className="text-muted-foreground mb-6">
            You're in Guest Mode. Create an account to save your profile and data permanently.
          </p>
          <Button onClick={() => navigate({ to: '/login' })} className="gap-2">
            Sign In / Register
          </Button>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name ?? storedUser?.name ?? 'Student';
  const displayUsername = userProfile?.username ?? storedUser?.username ?? '';

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username - read only */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              Username
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
              <span className="text-sm font-medium">@{displayUsername}</span>
              <Lock className="w-3 h-3 text-muted-foreground ml-auto" />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="profile-name" className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              Full Name
            </Label>
            {editing ? (
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            ) : (
              <div className="px-3 py-2 bg-muted/50 rounded-md">
                <span className="text-sm">{displayName}</span>
              </div>
            )}
          </div>

          {/* School */}
          <div className="space-y-1">
            <Label htmlFor="profile-school" className="text-xs text-muted-foreground flex items-center gap-1">
              <School className="w-3 h-3" />
              School
            </Label>
            {editing ? (
              <Input
                id="profile-school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Your school name"
              />
            ) : (
              <div className="px-3 py-2 bg-muted/50 rounded-md">
                <span className="text-sm">{userProfile?.school ?? '—'}</span>
              </div>
            )}
          </div>

          {/* Class */}
          <div className="space-y-1">
            <Label htmlFor="profile-class" className="text-xs text-muted-foreground flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              Class
            </Label>
            {editing ? (
              <select
                id="profile-class"
                value={studentClass}
                onChange={(e) => setStudentClass(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[8, 9, 10, 11, 12].map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-muted/50 rounded-md">
                <span className="text-sm">
                  Class {userProfile?.studentClass ? Number(userProfile.studentClass) : studentClass}
                </span>
              </div>
            )}
          </div>

          {editing && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saveProfile.isPending}
                className="flex-1 gap-2"
              >
                <Save className="w-4 h-4" />
                {saveProfile.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Update */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">App Version</p>
              <p className="text-xs text-muted-foreground">Check for the latest updates</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpgradeApp}
              disabled={upgrading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${upgrading ? 'animate-spin' : ''}`} />
              {upgrading ? 'Checking…' : 'Update App'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleLogout}
      >
        Sign Out
      </Button>
    </div>
  );
}
