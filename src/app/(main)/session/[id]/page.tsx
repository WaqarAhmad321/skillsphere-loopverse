"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { notFound, useParams, useRouter } from "next/navigation";
import type { Session, User, Message } from "@/types";
import {
  sendMessage,
  sendMessageWithFile,
  getSessionMessages,
  createWebRTCOffer,
  createWebRTCAnswer,
  addICECandidate,
  listenForWebRTCData,
} from "@/lib/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Send,
  PhoneOff,
  User as UserIcon,
  Paperclip,
  File as FileIcon,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-sessions";
import { useUser } from "@/hooks/use-users";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const getInitials = (name: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function ChatMessage({
  message,
  author,
}: {
  message: Message;
  author: User | null;
}) {
  const { user } = useAuth();
  const isCurrentUser = author?.id === user?.id;

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isCurrentUser ? "justify-end" : ""
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={author?.avatarUrl} />
          <AvatarFallback>
            {author ? getInitials(author.name) : "U"}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "rounded-lg p-3 max-w-xs text-sm",
          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <p className="font-semibold">{author?.name.split(" ")[0]}</p>
        {message.text && <p>{message.text}</p>}
        {message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 p-2 bg-background/20 rounded-md hover:bg-background/40"
          >
            <FileIcon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate flex-grow">{message.fileName}</span>
            <Download className="h-4 w-4 flex-shrink-0" />
          </a>
        )}
        <p className="text-xs opacity-70 mt-1 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={author?.avatarUrl} />
          <AvatarFallback>
            {author ? getInitials(author.name) : "U"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function SessionPageSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="md:col-span-2 space-y-4">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="flex-grow grid grid-rows-2 gap-4">
            <Skeleton className="w-full h-full rounded-lg" />
            <Skeleton className="w-full h-full rounded-lg" />
          </CardContent>
          <div className="p-4 border-t flex justify-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </Card>
      </div>
      <div className="md:col-span-1 flex flex-col h-full">
        <Card className="flex-grow flex flex-col">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="flex flex-row-reverse gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t flex gap-2">
            <Skeleton className="h-10 flex-grow rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function RemotePeerVideo({
  user,
  stream,
}: {
  user: User | null;
  stream: MediaStream | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center h-full w-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
      />
      {!stream && (
        <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="text-3xl">
              {user ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
        {user?.name || "Peer"}
      </div>
    </div>
  );
}

export default function SessionPage() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: session, isLoading: isSessionLoading } = useSession(
    sessionId as string
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);

  // WebRTC state
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Fetch participants' details
  const otherUserId =
    user?.id === session?.learnerId ? session?.mentorId : session?.learnerId;
  const { data: otherUser } = useUser(otherUserId, !!otherUserId);

  const cleanupWebRTC = useCallback(() => {
    console.log("Cleaning up WebRTC connection.");
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current?.srcObject) {
      (localVideoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
    setRemoteStream(null);
  }, []);

  const setupWebRTC = useCallback(
    async (localStream: MediaStream, isCaller: boolean) => {
      if (!user || !otherUserId || !sessionId) return;

      console.log(`Setting up WebRTC as ${isCaller ? "caller" : "callee"}`);
      peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks to the connection
      localStream.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, localStream);
      });

      // Listen for remote tracks
      peerConnectionRef.current.ontrack = (event) => {
        console.log("Received remote track:", event.streams[0]);
        setRemoteStream(event.streams[0]);
      };

      // Listen for ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && user?.id) {
          console.log("Sending ICE candidate:", event.candidate);
          addICECandidate(
            sessionId as string,
            user.id,
            event.candidate.toJSON()
          );
        }
      };

      // Create offer if this user is the "caller"
      if (isCaller) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        console.log("Created offer:", offer);
        await createWebRTCOffer(sessionId as string, user.id, offer);
      }
    },
    [user, otherUserId, sessionId]
  );

  useEffect(() => {
    if (!user || !sessionId || !otherUserId) return;

    let unsubscribe: (() => void) | undefined;

    const startWebRTC = async (localStream: MediaStream) => {
      unsubscribe = listenForWebRTCData(
        sessionId as string,
        user.id,
        otherUserId,
        {
          onOffer: async (offer) => {
            console.log("Received offer");
            if (!peerConnectionRef.current) {
              await setupWebRTC(localStream, false); // This user is the callee
            }
            await peerConnectionRef.current?.setRemoteDescription(
              new RTCSessionDescription(offer)
            );
            const answer = await peerConnectionRef.current!.createAnswer();
            await peerConnectionRef.current!.setLocalDescription(answer);
            console.log("Created answer");
            await createWebRTCAnswer(sessionId as string, user.id, answer);
          },
          onAnswer: async (answer) => {
            console.log("Received answer");
            if (
              peerConnectionRef.current &&
              !peerConnectionRef.current.currentRemoteDescription
            ) {
              await peerConnectionRef.current?.setRemoteDescription(
                new RTCSessionDescription(answer)
              );
            }
          },
          onCandidate: async (candidate) => {
            console.log("Received ICE candidate");
            if (peerConnectionRef.current?.remoteDescription) {
              await peerConnectionRef.current?.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            }
          },
          onNoOffer: async () => {
            console.log("No offer found, creating one.");
            await setupWebRTC(localStream, true); // This user is the caller
          },
        }
      );
    };

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setHasCameraPermission(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        await startWebRTC(stream);
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description:
            "Please enable camera permissions in your browser settings to use this app.",
        });
      }
    };

    getCameraPermission();

    return () => {
      if (unsubscribe) unsubscribe();
      cleanupWebRTC();
    };
  }, [user, sessionId, otherUserId, toast, setupWebRTC, cleanupWebRTC]);

  useEffect(() => {
    if (!sessionId || typeof sessionId !== "string") return;

    const unsubscribe = getSessionMessages(
      sessionId as string,
      (newMessages) => {
        setMessages(newMessages);
        setTimeout(() => {
          const viewport = scrollAreaRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]"
          );
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        }, 100);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !session) return;

    await sendMessage(session.id, user.id, newMessage.trim());
    setNewMessage("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendFile(file);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!user || !session) return;
    setIsUploading(true);
    const result = await sendMessageWithFile(session.id, user.id, file);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: result.error || "Could not send the file.",
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsUploading(false);
  };

  const toggleMediaTrack = (kind: "video" | "audio", enabled: boolean) => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const track = stream.getTracks().find((t) => t.kind === kind);
      if (track) {
        track.enabled = enabled;
      }
    }
  };

  const handleToggleCamera = () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    toggleMediaTrack("video", newState);
  };
  const handleToggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    toggleMediaTrack("audio", newState);
  };

  const handleEndCall = () => {
    cleanupWebRTC();
    router.push("/dashboard");
  };

  if (authLoading || isSessionLoading) {
    return <SessionPageSkeleton />;
  }

  if (!session) {
    notFound();
    return null;
  }

  // Authorization check
  if (user?.id !== session.learnerId && user?.id !== session.mentorId) {
    notFound();
    return null;
  }

  const participants = {
    [user!.id]: user,
    ...(otherUser && { [otherUser.id]: otherUser }),
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Video Chat Panel */}
      <div className="md:col-span-2 space-y-4">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Live Session</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow grid grid-rows-2 gap-4">
            {/* Other User's Video */}
            <RemotePeerVideo user={otherUser || null} stream={remoteStream} />

            {/* Current User's Video */}
            <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center h-full w-full">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {(!isCameraOn || hasCameraPermission === false) && (
                <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-3xl">
                      {user ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                {user?.name || "You"}
              </div>
              {hasCameraPermission === false && (
                <Alert
                  variant="destructive"
                  className="absolute top-4 left-4 right-4 w-auto"
                >
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to use this feature.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          {/* Controls */}
          <div className="p-4 border-t flex justify-center items-center gap-4 bg-background">
            <Button
              variant={isMicOn ? "outline" : "destructive"}
              size="icon"
              className="rounded-full"
              onClick={handleToggleMic}
            >
              {isMicOn ? <Mic /> : <MicOff />}
            </Button>
            <Button
              variant={isCameraOn ? "outline" : "destructive"}
              size="icon"
              className="rounded-full"
              onClick={handleToggleCamera}
            >
              {isCameraOn ? <Video /> : <VideoOff />}
            </Button>
            <Button
              variant="destructive"
              className="rounded-full px-6"
              onClick={handleEndCall}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              End Call
            </Button>
          </div>
        </Card>
      </div>

      {/* Chat Panel */}
      <div className="md:col-span-1 flex flex-col h-full">
        <Card className="flex-grow flex flex-col">
          <CardHeader>
            <CardTitle>Session Chat</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  author={participants[msg.senderId]}
                />
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-background">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={isUploading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || isUploading}
              >
                <Send className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
