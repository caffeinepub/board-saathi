import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StudentFeedback {
    id: bigint;
    createdAt: Time;
    feedbackType: FeedbackType;
    message: string;
    student: Principal;
    parent: Principal;
}
export interface StudentProfile {
    username: string;
    school: string;
    password: Password;
    name: string;
    studentClass: bigint;
}
export type Time = bigint;
export interface PresenceInfo {
    isOnline: boolean;
    lastSeen: Time;
}
export interface Password {
    hash: string;
}
export interface ChatMessage {
    id: bigint;
    content: string;
    isRead: boolean;
    timestamp: Time;
    senderRole: string;
    senderId: Principal;
}
export interface ParentProfile {
    username: string;
    password: Password;
    name: string;
    linkedStudentUsername: string;
}
export interface UserProfile {
    username: string;
    school: string;
    name: string;
    studentClass: bigint;
}
export enum FeedbackType {
    appreciate = "appreciate",
    scold = "scold",
    comment = "comment"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStudentFeedback(student: Principal, message: string, feedbackType: FeedbackType): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteFeedback(feedbackId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFeedbackById(feedbackId: bigint): Promise<StudentFeedback>;
    getFeedbackForStudent(student: Principal): Promise<Array<StudentFeedback>>;
    getFeedbackFromParent(parent: Principal): Promise<Array<StudentFeedback>>;
    getMessages(user: Principal): Promise<[Array<ChatMessage>, boolean]>;
    getParentByUsername(username: string): Promise<ParentProfile | null>;
    getParentProfileByUsername(username: string): Promise<ParentProfile | null>;
    getPresence(user: Principal): Promise<PresenceInfo>;
    getStudentByUsername(username: string): Promise<StudentProfile | null>;
    getTypingStatus(user: Principal): Promise<boolean>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markMessagesRead(sender: Principal): Promise<void>;
    registerParent(username: string, name: string, linkedStudentUsername: string, password: string): Promise<void>;
    registerStudent(username: string, name: string, school: string, studentClass: bigint, password: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(recipient: Principal, senderRole: string, content: string): Promise<void>;
    setTyping(isTyping: boolean): Promise<void>;
    updateFeedback(feedbackId: bigint, updatedMessage: string, feedbackType: FeedbackType): Promise<void>;
    updatePresence(isOnline: boolean): Promise<void>;
}
