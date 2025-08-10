

// This file handles all database interactions with Firebase Firestore.

import { db, storage } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, writeBatch, onSnapshot, orderBy, serverTimestamp, runTransaction, deleteField, limit, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { User, Mentor, Session, Message, Notification } from '@/types';
import { z } from 'zod';
import { sessionSummarizer } from '@/ai/flows/session-summarizer';


// --- Notification Operations ---
export async function createNotification(userId: string, message: string, link?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
            userId,
            message,
            link: link || '',
            isRead: false,
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error creating notification:", error);
        return { success: false, error: "Could not create notification." };
    }
}

export function getNotificationsByUserId(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications: Notification[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
            } as Notification);
        });
        callback(notifications);
    });

    return unsubscribe;
}

export async function markNotificationsAsRead(notificationIds: string[]): Promise<{ success: boolean }> {
    if (notificationIds.length === 0) {
        return { success: true };
    }
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
        const notifRef = doc(db, 'notifications', id);
        batch.update(notifRef, { isRead: true });
    });
    await batch.commit();
    return { success: true };
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await deleteDoc(notificationRef);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting notification:", error);
        return { success: false, error: "Could not delete notification." };
    }
}


// --- Read Operations ---

export async function getUserProfileById(userId: string): Promise<User | Mentor | null> {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const user: User | Mentor = {
                id: userId,
                ...data,
                ...(data.role === 'mentor' && !data.availability ? { availability: {} } : {})
            } as User | Mentor;
            return user;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching profile for user ${userId}:`, error);
        return null;
    }
}


export async function findUserById(userId: string): Promise<User | Mentor | null> {
    return getUserProfileById(userId);
}

export async function getAllMentors(): Promise<Mentor[]> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("role", "==", "mentor"));
        const querySnapshot = await getDocs(q);
        const mentors: Mentor[] = [];
        querySnapshot.forEach((doc) => {
            mentors.push({ id: doc.id, ...doc.data() } as Mentor);
        });
        return mentors;
    } catch (error) {
        console.error("Error fetching all mentors:", error);
        return [];
    }
}

export async function findMentorById(mentorId: string): Promise<Mentor | null> {
    const mentorProfile = await getUserProfileById(mentorId);
    if(mentorProfile && mentorProfile.role === 'mentor'){
        return mentorProfile as Mentor;
    }
    return null;
}

export async function getSessionsByLearnerId(learnerId: string): Promise<Session[]> {
    try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where("learnerId", "==", learnerId));
        const querySnapshot = await getDocs(q);
        const sessions: Session[] = [];
        querySnapshot.forEach((doc) => {
            sessions.push({ id: doc.id, ...doc.data() } as Session);
        });
        return sessions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error(`Error fetching sessions for learner ${learnerId}:`, error);
        return [];
    }
}

export async function getSessionsByMentorId(mentorId: string): Promise<Session[]> {
     try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where("mentorId", "==", mentorId));
        const querySnapshot = await getDocs(q);
        const sessions: Session[] = [];
        querySnapshot.forEach((doc) => {
            sessions.push({ id: doc.id, ...doc.data() } as Session);
        });
        return sessions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error(`Error fetching sessions for mentor ${mentorId}:`, error);
        return [];
    }
}

export async function getAllUsers(): Promise<User[]> {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() } as User);
        });
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
}

export async function getAllSessions(): Promise<Session[]> {
     try {
        const sessionsRef = collection(db, 'sessions');
        const querySnapshot = await getDocs(sessionsRef);
        const sessions: Session[] = [];
        querySnapshot.forEach((doc) => {
            sessions.push({ id: doc.id, ...doc.data() } as Session);
        });
        return sessions;
    } catch (error) {
        console.error("Error fetching all sessions:", error);
        return [];
    }
}


export async function getSessionById(sessionId: string): Promise<Session | null> {
    try {
        const sessionDocRef = doc(db, 'sessions', sessionId);
        const sessionDocSnap = await getDoc(sessionDocRef);

        if (sessionDocSnap.exists()) {
            return { id: sessionId, ...sessionDocSnap.data() } as Session;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching session ${sessionId}:`, error);
        return null;
    }
}

export function getSessionMessages(sessionId: string, callback: (messages: Message[]) => void): () => void {
    const messagesRef = collection(db, 'sessions', sessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: Message[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
            } as Message);
        });
        callback(messages);
    });

    return unsubscribe;
}

export async function getSessionMessagesAsTranscript(sessionId: string): Promise<string> {
    const messagesRef = collection(db, 'sessions', sessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const querySnapshot = await getDocs(q);

    const userIds = new Set<string>();
    const messages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        userIds.add(data.senderId);
        return data as Message;
    });

    const userMap: Record<string, string> = {};
    for (const userId of userIds) {
        const user = await findUserById(userId);
        userMap[userId] = user?.name || 'Unknown User';
    }

    const transcript = messages.map(msg => {
        const author = userMap[msg.senderId];
        let content = '';
        if (msg.text) {
            content = msg.text;
        } else if (msg.fileName) {
            content = `[Sent a file: ${msg.fileName}]`;
        }
        return `${author}: ${content}`;
    }).join('\n');

    return transcript;
}


// --- Write Operations ---

export async function sendMessage(sessionId: string, senderId: string, text: string): Promise<{ success: boolean, error?: string }> {
    try {
        const messagesRef = collection(db, 'sessions', sessionId, 'messages');
        await addDoc(messagesRef, {
            senderId,
            text,
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error sending message:", error);
        return { success: false, error: "Could not send message." };
    }
}

export async function sendMessageWithFile(sessionId: string, senderId: string, file: File): Promise<{ success: boolean; error?: string }> {
  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  try {
    // 1. Upload file to Firebase Storage
    const storageRef = ref(storage, `session_files/${sessionId}/${Date.now()}_${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 2. Add message to Firestore
    const messagesRef = collection(db, 'sessions', sessionId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      fileUrl: downloadURL,
      fileName: file.name,
      fileType: file.type,
      timestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending file:', error);
    return { success: false, error: 'Could not send the file.' };
  }
}

const createProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['learner', 'mentor']),
});

export async function createUserProfile(userId: string, data: z.infer<typeof createProfileSchema>): Promise<User | Mentor> {
    const result = createProfileSchema.safeParse(data);
    if (!result.success) {
        throw new Error("Invalid user profile data.");
    }
    const { name, email, role } = result.data;
    const userRef = doc(db, 'users', userId);

    let newUserProfileData: Omit<User, 'id'> | Omit<Mentor, 'id'> = {
        name,
        email,
        role,
        avatarUrl: `https://placehold.co/100x100.png?text=${name.split(' ').map(n => n[0]).join('').toUpperCase()}`,
        bio: '',
        skills: [],
        interests: [],
    };

    if (role === 'mentor') {
        const mentorProfileData: Omit<Mentor, 'id'> = {
            ...newUserProfileData,
            role: 'mentor',
            rating: 0,
            reviews: 0,
            availability: {},
            subjects: [],
            isApproved: false,
            portfolioUrl: ''
        };
        newUserProfileData = mentorProfileData;
    }

    await setDoc(userRef, newUserProfileData, { merge: true }); // Use merge to avoid overwriting existing data on Google sign-in

    const newUserProfile = { id: userId, ...newUserProfileData };
    console.log("Created/updated user profile in Firestore:", newUserProfile);
    return newUserProfile as User | Mentor;
}


export async function updateMentorApproval(mentorId: string, isApproved: boolean): Promise<{ success: boolean; error?: string }> {
  console.log(`Updating mentor ${mentorId} approval to ${isApproved}`);
  const mentorDocRef = doc(db, 'users', mentorId);
  try {
    await updateDoc(mentorDocRef, { isApproved });
    if(isApproved) {
        await createNotification(mentorId, "Congratulations! Your mentor application has been approved.", "/profile");
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error updating mentor approval:", error)
    return { success: false, error: error.message };
  }
}

const createSessionSchema = z.object({
  mentorId: z.string(),
  learnerId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  time: z.string(),
});

export async function createSession(input: z.infer<typeof createSessionSchema>): Promise<{ success: boolean; error?: string, sessionId?: string }> {
    const result = createSessionSchema.safeParse(input);
    if (!result.success) {
        return { success: false, error: "Invalid input data." };
    }

    const { mentorId, learnerId, date, time } = result.data;

    // Check if slot is still available
    const mentor = await findMentorById(mentorId);
    if (!mentor || !mentor.availability?.[date]?.includes(time)) {
        return { success: false, error: "This time slot is no longer available."};
    }
    const learner = await findUserById(learnerId);
    if (!learner) {
        return { success: false, error: "Learner not found." };
    }

    const newSessionData = {
        mentorId,
        learnerId,
        date,
        time,
        status: 'pending' as const,
        keywords: '',
        summary: '',
        feedback: null,
    };

    try {
        const docRef = await addDoc(collection(db, "sessions"), newSessionData);
        console.log("Created new session request in Firestore with ID:", docRef.id);
        await createNotification(mentorId, `You have a new session request from ${learner.name}.`, '/dashboard');
        return { success: true, sessionId: docRef.id };
    } catch(error: any) {
        console.error("Error creating session:", error);
        return { success: false, error: "Could not create session in database." };
    }
}

export async function updateSessionStatus(
    sessionId: string,
    newStatus: 'upcoming' | 'cancelled',
    mentorId: string,
    date: string,
    time: string
): Promise<{ success: boolean; error?: string }> {
    const sessionDocRef = doc(db, 'sessions', sessionId);
    const mentorDocRef = doc(db, 'users', mentorId);

    try {
        await runTransaction(db, async (transaction) => {
            const sessionDoc = await transaction.get(sessionDocRef);
            const mentorDoc = await transaction.get(mentorDocRef);

            if (!sessionDoc.exists()) throw new Error("Session not found");
            if (!mentorDoc.exists()) throw new Error("Mentor not found");
            
            const session = sessionDoc.data() as Session;
            const mentor = mentorDoc.data() as Mentor;


            // Update the session status
            transaction.update(sessionDocRef, { status: newStatus });

            // If approving, remove the time slot from availability
            if (newStatus === 'upcoming') {
                const currentAvailability = mentor.availability?.[date] || [];
                const newAvailability = currentAvailability.filter(t => t !== time);
                
                const availabilityUpdate: Record<string, any> = {};
                if (newAvailability.length > 0) {
                    availabilityUpdate[`availability.${date}`] = newAvailability;
                } else {
                    availabilityUpdate[`availability.${date}`] = deleteField();
                }
                transaction.update(mentorDocRef, availabilityUpdate);

                await createNotification(session.learnerId, `Your session with ${mentor.name} has been confirmed!`, `/session/${sessionId}`);
            } else if (newStatus === 'cancelled') {
                await createNotification(session.learnerId, `Your session with ${mentor.name} on ${date} has been declined.`, '/dashboard');
            }
        });

        console.log(`Updated session ${sessionId} to ${newStatus}`);
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating session ${sessionId}:`, error);
        return { success: false, error: "Could not update the session." };
    }
}


const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  interests: z.union([z.string(), z.array(z.string())]).optional(),
  subjects: z.union([z.string(), z.array(z.string())]).optional(),
  availability: z.record(z.array(z.string())).optional(),
  portfolioUrl: z.string().url().or(z.literal('')).optional(),
});


export async function updateUserProfile(userId: string, data: Partial<z.infer<typeof profileUpdateSchema>>): Promise<{ success: boolean, error?: string }> {
    const userDocRef = doc(db, 'users', userId);

    const updateData: Record<string, any> = {};

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key as keyof typeof data];
            if (['skills', 'interests', 'subjects'].includes(key) && typeof value === 'string') {
                updateData[key] = value.split(',').map(s => s.trim()).filter(Boolean);
            } else if (value !== undefined) {
                 updateData[key] = value;
            }
        }
    }

    try {
        await updateDoc(userDocRef, updateData);
        console.log(`Updated profile for user ${userId}:`, updateData);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Could not update profile."};
    }
}

export async function updateSession(sessionId: string, data: Partial<Session>): Promise<{ success: boolean, error?: string }> {
    const sessionDocRef = doc(db, 'sessions', sessionId);
    try {
        await updateDoc(sessionDocRef, data);
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating session ${sessionId}:`, error);
        return { success: false, error: "Could not update session." };
    }
}

const feedbackSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
})

export async function addFeedbackToSession(sessionId: string, mentorId: string, feedback: z.infer<typeof feedbackSchema>): Promise<{ success: boolean; error?: string }> {
    const result = feedbackSchema.safeParse(feedback);
    if (!result.success) {
        return { success: false, error: "Invalid feedback data." };
    }

    const sessionDocRef = doc(db, 'sessions', sessionId);
    const mentorDocRef = doc(db, 'users', mentorId);

    try {
        await runTransaction(db, async (transaction) => {
            const mentorDoc = await transaction.get(mentorDocRef);
            if (!mentorDoc.exists()) {
                throw "Mentor not found.";
            }

            const mentorData = mentorDoc.data() as Mentor;

            // Calculate new rating and reviews count
            const currentRating = mentorData.rating || 0;
            const currentReviews = mentorData.reviews || 0;
            const newReviews = currentReviews + 1;
            const newRating = ((currentRating * currentReviews) + feedback.rating) / newReviews;

            // Update mentor profile
            transaction.update(mentorDocRef, {
                rating: newRating,
                reviews: newReviews,
            });

            // Update session with feedback
            transaction.update(sessionDocRef, { feedback: result.data });
        });
        await createNotification(mentorId, "You have new feedback on a recent session.", `/mentors/${mentorId}`);
        return { success: true };
    } catch (e: any) {
        console.error("Feedback transaction failed: ", e);
        return { success: false, error: e.toString() || "Could not submit feedback." };
    }
}


export async function removeFeedbackFromSession(sessionId: string, mentorId: string, ratingToRemove: number): Promise<{ success: boolean; error?: string }> {
    const sessionDocRef = doc(db, 'sessions', sessionId);
    const mentorDocRef = doc(db, 'users', mentorId);

    try {
        await runTransaction(db, async (transaction) => {
            const mentorDoc = await transaction.get(mentorDocRef);
            if (!mentorDoc.exists()) {
                throw new Error("Mentor not found.");
            }
            const mentorData = mentorDoc.data() as Mentor;

            // Recalculate rating
            const currentTotalRating = (mentorData.rating || 0) * (mentorData.reviews || 0);
            const newReviews = (mentorData.reviews || 1) - 1;
            let newRating = 0;
            if (newReviews > 0) {
                newRating = (currentTotalRating - ratingToRemove) / newReviews;
            }

            // Update mentor document
            transaction.update(mentorDocRef, {
                rating: newRating,
                reviews: newReviews,
            });

            // Remove feedback from session document
            transaction.update(sessionDocRef, {
                feedback: deleteField()
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error removing feedback:", error);
        return { success: false, error: "Could not remove feedback." };
    }
}


export async function checkAndCompleteSessions(sessions: Session[]): Promise<Session[]> {
    const now = new Date();
    const batch = writeBatch(db);
    let sessionsWereCompleted = false;

    const updatedSessions = await Promise.all(sessions.map(async (session) => {
        if (session.status !== 'upcoming') return session;
        
        const [year, month, day] = session.date.split('-').map(Number);
        const [hours, minutes] = session.time.split(':').map(Number);
        const sessionDateTime = new Date(year, month - 1, day, hours, minutes);
        
        if (sessionDateTime < now) {
            sessionsWereCompleted = true;
            const sessionRef = doc(db, 'sessions', session.id);
            batch.update(sessionRef, { status: 'completed' });
            
            // Automatically generate AI summary
            try {
                console.log(`Generating summary for session ${session.id}...`);
                const transcript = await getSessionMessagesAsTranscript(session.id);
                const result = await sessionSummarizer({ chatHistory: transcript });
                if (result.summary) {
                    batch.update(sessionRef, { summary: result.summary });
                    console.log(`Summary generated for session ${session.id}`);

                    // Notify both users
                    const link = `/mentors/${session.mentorId}`; // Or a specific session summary page
                    await createNotification(session.learnerId, `Your session summary is ready.`, link);
                    await createNotification(session.mentorId, `The AI summary for your session is ready.`, link);
                }
            } catch (aiError) {
                console.error(`Failed to generate AI summary for session ${session.id}:`, aiError);
            }

            return { ...session, status: 'completed' } as Session;
        }
        return session;
    }));

    if (sessionsWereCompleted) {
        await batch.commit();
        console.log("Completed past sessions and triggered summaries.");
        return updatedSessions;
    }

    return sessions;
}


// --- WebRTC Signaling Operations ---

export async function createWebRTCOffer(sessionId: string, userId: string, offer: RTCSessionDescriptionInit) {
    const webrtcRef = doc(db, 'sessions', sessionId, 'webrtc', userId);
    await setDoc(webrtcRef, { offer });
}

export async function createWebRTCAnswer(sessionId: string, userId: string, answer: RTCSessionDescriptionInit) {
    const webrtcRef = doc(db, 'sessions', sessionId, 'webrtc', userId);
    await updateDoc(webrtcRef, { answer });
}

export async function addICECandidate(sessionId: string, userId: string, candidate: RTCIceCandidateInit) {
    const candidatesRef = collection(db, 'sessions', sessionId, 'webrtc', userId, 'candidates');
    await addDoc(candidatesRef, candidate);
}

interface WebRTCCallbacks {
    onOffer: (offer: RTCSessionDescriptionInit) => void;
    onAnswer: (answer: RTCSessionDescriptionInit) => void;
    onCandidate: (candidate: RTCIceCandidateInit) => void;
    onNoOffer: () => void;
}

export function listenForWebRTCData(sessionId: string, selfId: string, peerId: string, callbacks: WebRTCCallbacks): () => void {
    const peerDocRef = doc(db, 'sessions', sessionId, 'webrtc', peerId);

    const unsubscribe = onSnapshot(peerDocRef, (snapshot) => {
        const data = snapshot.data();
        
        // Listen for offers from the peer
        if (data?.offer) {
            callbacks.onOffer(data.offer);
        }

        // Listen for answers from the peer
        if (data?.answer) {
            callbacks.onAnswer(data.answer);
        }
    }, async (error) => {
        // If peer document doesn't exist, it likely means there's no offer yet.
        const peerDoc = await getDoc(peerDocRef);
        if (error.code === 'not-found' || !peerDoc.exists()) {
            callbacks.onNoOffer();
        } else {
            console.error("Error listening for WebRTC data:", error);
        }
    });
    
    // Listen for ICE candidates from peer
    const peerCandidatesRef = collection(db, 'sessions', sessionId, 'webrtc', peerId, 'candidates');
    const unsubscribeCandidates = onSnapshot(peerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                callbacks.onCandidate(change.doc.data());
            }
        });
    });

    return () => {
        unsubscribe();
        unsubscribeCandidates();
    };
}
    
