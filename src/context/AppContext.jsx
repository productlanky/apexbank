import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; 

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [transactions, setTransactions] = useState([]); 
  const [hideBalance, setHideBalance] = useState(false);

  // --- 🔥 REAL-TIME FIREBASE LISTENERS 🔥 ---
  useEffect(() => {
    let unsubUser = null;
    let unsubTxns = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // 1. LIVE Listen to User Profile
        unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
          
          // FIX: We tell the app to stop loading ONLY AFTER the profile (and role) is fully fetched!
          setLoadingAuth(false); 
        });

        // 2. LIVE Listen to Transactions
        const txnsQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid)
        );
        
        unsubTxns = onSnapshot(txnsQuery, (snapshot) => {
          const fetchedTxns = [];
          snapshot.forEach((doc) => {
            fetchedTxns.push({ id: doc.id, ...doc.data() });
          });
          
          fetchedTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
          setTransactions(fetchedTxns);
        });

      } else {
        setUserProfile(null);
        setTransactions([]);
        setLoadingAuth(false); // Stop loading if nobody is logged in
        if (unsubUser) unsubUser();
        if (unsubTxns) unsubTxns();
      }
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubUser) unsubUser();
      if (unsubTxns) unsubTxns();
    };
  }, []);

  // --- SEND FUNCTION ---
  async function send(contact, amount, note, currency = 'USD') {
    if (!currentUser || !userProfile) throw new Error("Not authenticated");

    const userStatus = (userProfile?.status || userProfile?.accountStatus || "").toLowerCase();
    if (userStatus === "frozen" || userStatus === "suspended" || userStatus === "hold") {
      throw new Error("Account is currently frozen. Outgoing transactions are disabled.");
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) throw new Error("Invalid amount");

    const currentBalance = Number(userProfile.balances?.[currency]) || 0;
    if (currentBalance < numAmount) {
      throw new Error(`Insufficient funds in ${currency}`);
    }

    const newBalances = {
      ...userProfile.balances,
      [currency]: currentBalance - numAmount
    };

    await addDoc(collection(db, "transactions"), {
      userId: currentUser.uid,
      type: 'debit',
      name: contact.name,
      avatar: contact.avatar || contact.name.charAt(0).toUpperCase(),
      amount: numAmount,
      currency: currency,
      date: new Date().toISOString(),
      category: 'Transfer',
      note: note || '',
      status: 'Completed',
      timestamp: serverTimestamp()
    });

    await updateDoc(doc(db, "users", currentUser.uid), {
      balances: newBalances,
      balance: newBalances.USD // Legacy fallback
    });
  }

  const value = {
    currentUser,
    userProfile, 
    loadingAuth, 
    transactions,
    hideBalance,
    toggleHide: () => setHideBalance(v => !v),
    send
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);