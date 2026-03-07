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
export interface ParentProfilePublic {
    username: string;
    name: string;
    linkedStudentUsername: string;
}
export interface PresenceInfo {
    isOnline: boolean;
    lastSeen: Time;
}
export type Time = bigint;
export interface StudentProfilePublic {
    username: string;
    school: string;
    name: string;
    studentClass: bigint;
}
export interface ChatMessage {
    id: bigint;
    content: string;
    isRead: boolean;
    timestamp: Time;
    senderRole: string;
    senderId: Principal;
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
    /**
     * / Get data for the caller's principal by dataType
     */
    getMyData(dataType: string): Promise<string | null>;
    getParentByUsername(username: string): Promise<ParentProfilePublic | null>;
    getParentProfileByUsername(username: string): Promise<ParentProfilePublic | null>;
    getPresence(user: Principal): Promise<PresenceInfo>;
    getStudentByUsername(username: string): Promise<StudentProfilePublic | null>;
    getTypingStatus(user: Principal): Promise<boolean>;
    /**
     * / Get user data by username + dataType - only owner or admin can read
     */
    getUserData(username: string, dataType: string): Promise<string | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List all data types stored for the caller's principal
     */
    listMyDataTypes(): Promise<Array<string>>;
    /**
     * / List all data types stored for a given username - only owner or admin can list
     */
    listUserDataTypes(username: string): Promise<Array<string>>;
    markMessagesRead(sender: Principal): Promise<void>;
    registerParent(username: string, name: string, linkedStudentUsername: string, password: string): Promise<void>;
    registerStudent(username: string, name: string, school: string, studentClass: bigint, password: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Save data for the caller's principal under a specific dataType
     */
    saveMyData(dataType: string, jsonBlob: string): Promise<void>;
    /**
     * / Save user data (username + dataType) JSON blob - only owner or admin can save
     */
    saveUserData(username: string, dataType: string, jsonBlob: string): Promise<void>;
    sendMessage(recipient: Principal, senderRole: string, content: string): Promise<void>;
    setTyping(isTyping: boolean): Promise<void>;
    updateFeedback(feedbackId: bigint, updatedMessage: string, feedbackType: FeedbackType): Promise<void>;
    updatePresence(isOnline: boolean): Promise<void>;
}
