import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type Password = { hash : Text };
  type Subject = { id : Nat; name : Text };
  type Chapter = { id : Nat; subjectId : Nat; name : Text; weightage : Nat; completed : Bool };
  type Note = { id : Nat; chapterId : Nat; content : Text; imageData : ?Text; createdAt : Time.Time };
  type Question = { id : Nat; chapterId : Nat; subjectId : Nat; questionText : Text; answer : Text };
  type PlannerTask = { id : Nat; title : Text; description : Text; date : Time.Time; startTime : Text; completed : Bool };
  type Reminder = { id : Nat; text : Text; dateTime : Time.Time };
  type Target = { id : Nat; title : Text; description : Text; deadline : Time.Time; completed : Bool };
  type MCQQuestion = { id : Nat; questionText : Text; options : [Text]; correctOption : Nat };
  type MockTest = { id : Nat; name : Text; subjectId : Nat; questions : [MCQQuestion] };
  type QuestionResult = { questionId : Nat; questionText : Text; selectedOption : Nat; correctOption : Nat; isCorrect : Bool };
  type TestReport = { testId : Nat; testName : Text; score : Nat; total : Nat; percentage : Nat; timeTaken : Int; results : [QuestionResult] };
  type TestAttempt = { id : Nat; testId : Nat; report : TestReport; attemptedAt : Time.Time };
  type RevisionTask = { id : Nat; chapterId : Nat; subjectId : Nat; dueDate : Time.Time; completed : Bool; revisionNumber : Nat; plannerTaskId : ?Nat };
  type Flashcard = { id : Nat; chapterId : Nat; subjectId : Nat; front : Text; back : Text; learned : Bool };
  type StudyStreak = { currentStreak : Nat; lastActiveDate : Time.Time; topStreak : Nat };
  type UserAchievement = { id : Nat; achievementType : Text; achievedAt : Time.Time };
  type FeedbackType = { #comment; #appreciate; #scold };
  type StudentFeedback = { id : Nat; parent : Principal; student : Principal; feedbackType : FeedbackType; message : Text; createdAt : Time.Time };
  type UserProfile = { name : Text; username : Text; school : Text; studentClass : Nat };
  type ChatMessage = { id : Nat; senderId : Principal; senderRole : Text; content : Text; timestamp : Time.Time; isRead : Bool };
  type PresenceInfo = { lastSeen : Time.Time; isOnline : Bool };
  type TypingStatus = { userId : Principal; isTyping : Bool; timestamp : Time.Time };

  type OldActor = {
    chatMessages : List.List<ChatMessage>;
    userPresence : Map.Map<Principal, PresenceInfo>;
    typingStatus : Map.Map<Principal, TypingStatus>;
    studentProfiles : Map.Map<Principal, OldStudentProfile>;
    parentProfiles : Map.Map<Text, OldParentProfile>;
    userProfiles : Map.Map<Principal, UserProfile>;
    userSubjects : Map.Map<Principal, [Subject]>;
    userChapters : Map.Map<Principal, [Chapter]>;
    userNotes : Map.Map<Principal, [Note]>;
    userQuestions : Map.Map<Principal, [Question]>;
    userPlannerTasks : Map.Map<Principal, [PlannerTask]>;
    userReminders : Map.Map<Principal, [Reminder]>;
    userTargets : Map.Map<Principal, [Target]>;
    userMockTests : Map.Map<Principal, [MockTest]>;
    userTestAttempts : Map.Map<Principal, [TestAttempt]>;
    userFlashcards : Map.Map<Principal, [Flashcard]>;
    userRevisionTasks : Map.Map<Principal, [RevisionTask]>;
    userStudyStreaks : Map.Map<Principal, StudyStreak>;
    userAchievements : Map.Map<Principal, [UserAchievement]>;
    userStudentFeedback : Map.Map<Principal, [StudentFeedback]>;
    subjectIdCounter : Nat;
    chapterIdCounter : Nat;
    noteIdCounter : Nat;
    questionIdCounter : Nat;
    plannerTaskIdCounter : Nat;
    reminderIdCounter : Nat;
    targetIdCounter : Nat;
    mockTestIdCounter : Nat;
    testAttemptIdCounter : Nat;
    revisionIdCounter : Nat;
    flashcardIdCounter : Nat;
    achievementIdCounter : Nat;
    studentFeedbackIdCounter : Nat;
    messageIdCounter : Nat;
  };

  // Old types without userDataStore
  type OldStudentProfile = {
    name : Text;
    username : Text;
    school : Text;
    studentClass : Nat;
    password : Password;
  };

  type OldParentProfile = {
    name : Text;
    username : Text;
    linkedStudentUsername : Text;
    password : Password;
  };

  type NewActor = {
    chatMessages : List.List<ChatMessage>;
    userPresence : Map.Map<Principal, PresenceInfo>;
    typingStatus : Map.Map<Principal, TypingStatus>;
    studentProfiles : Map.Map<Principal, OldStudentProfile>;
    parentProfiles : Map.Map<Text, OldParentProfile>;
    userProfiles : Map.Map<Principal, UserProfile>;
    userSubjects : Map.Map<Principal, [Subject]>;
    userChapters : Map.Map<Principal, [Chapter]>;
    userNotes : Map.Map<Principal, [Note]>;
    userQuestions : Map.Map<Principal, [Question]>;
    userPlannerTasks : Map.Map<Principal, [PlannerTask]>;
    userReminders : Map.Map<Principal, [Reminder]>;
    userTargets : Map.Map<Principal, [Target]>;
    userMockTests : Map.Map<Principal, [MockTest]>;
    userTestAttempts : Map.Map<Principal, [TestAttempt]>;
    userFlashcards : Map.Map<Principal, [Flashcard]>;
    userRevisionTasks : Map.Map<Principal, [RevisionTask]>;
    userStudyStreaks : Map.Map<Principal, StudyStreak>;
    userAchievements : Map.Map<Principal, [UserAchievement]>;
    userStudentFeedback : Map.Map<Principal, [StudentFeedback]>;
    subjectIdCounter : Nat;
    chapterIdCounter : Nat;
    noteIdCounter : Nat;
    questionIdCounter : Nat;
    plannerTaskIdCounter : Nat;
    reminderIdCounter : Nat;
    targetIdCounter : Nat;
    mockTestIdCounter : Nat;
    testAttemptIdCounter : Nat;
    revisionIdCounter : Nat;
    flashcardIdCounter : Nat;
    achievementIdCounter : Nat;
    studentFeedbackIdCounter : Nat;
    messageIdCounter : Nat;
    userDataStore : Map.Map<Text, Map.Map<Text, Text>>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserDataStore = Map.empty<Text, Map.Map<Text, Text>>();
    { old with userDataStore = newUserDataStore };
  };
};
