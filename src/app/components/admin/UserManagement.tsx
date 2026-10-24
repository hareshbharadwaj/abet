import { useState, useEffect } from 'react';
import { User } from '../../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Check, X, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { firestore } from '../../../config/firebase';
import { collection, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';
import { userStorage } from '../../../utils/localStorage';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: User[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ uid: doc.id, ...doc.data() } as User);
      });

      // Merge with local storage users
      const localUsers = userStorage.getUsers();
      const mergedList = [...usersList];
      localUsers.forEach(localUser => {
        const index = mergedList.findIndex(u => u.uid === localUser.uid || u.email === localUser.email);
        if (index > -1) {
          // Prioritize local status if it was approved/blocked locally
          if (localUser.status !== mergedList[index].status) {
            mergedList[index] = { ...mergedList[index], status: localUser.status };
          }
        } else {
          mergedList.push(localUser);
        }
      });

      setUsers(mergedList);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore error fetching users, using localStorage:", error);
      const localUsers = userStorage.getUsers();
      setUsers(localUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserStatus = async (userId: string, status: 'active' | 'blocked') => {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, { status });
    } catch (error) {
      console.warn('Firestore updating user failed, using localStorage fallback:', error);
    }
    
    // Sync localStorage and state
    const localUsers = userStorage.getUsers();
    const updated = localUsers.map(u => u.uid === userId ? { ...u, status } : u);
    userStorage.setUsers(updated);
    setUsers(updated);
    toast.success(`User ${status === 'active' ? 'approved' : 'blocked'}`);
  };

  const filterUsers = (role?: string, status?: string) => {
    let filtered = users;
    if (role) filtered = filtered.filter(u => u.role === role);
    if (status) filtered = filtered.filter(u => u.status === status);
    return filtered;
  };

  const UserCard = ({ user }: { user: User }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={user.photoURL} />
            <AvatarFallback className="bg-green-100 text-green-700">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="capitalize">{user.role}</Badge>
              <Badge className={
                user.status === 'active' ? 'bg-green-500' :
                user.status === 'blocked' ? 'bg-red-500' :
                'bg-yellow-500'
              }>
                {user.status}
              </Badge>
            </div>
          </div>
          {user.status === 'pending' && (
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={() => updateUserStatus(user.uid, 'active')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateUserStatus(user.uid, 'blocked')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {user.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateUserStatus(user.uid, 'blocked')}
            >
              <Ban className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6">
        <h1 className="text-2xl">User Management</h1>
        <p className="text-green-100">{users.length} total users</p>
      </div>

      <div className="p-4">
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buyers">Buyers</TabsTrigger>
            <TabsTrigger value="sellers">Sellers</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {users.map(user => <UserCard key={user.uid} user={user} />)}
          </TabsContent>

          <TabsContent value="buyers" className="space-y-3 mt-4">
            {filterUsers('buyer').map(user => <UserCard key={user.uid} user={user} />)}
          </TabsContent>

          <TabsContent value="sellers" className="space-y-3 mt-4">
            {filterUsers('seller').map(user => <UserCard key={user.uid} user={user} />)}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {filterUsers(undefined, 'pending').map(user => <UserCard key={user.uid} user={user} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
