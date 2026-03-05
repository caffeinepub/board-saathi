import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

// Apply migration using with-clause
(with migration = Migration.run)
actor {
  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  public type Password = {
    hash : Text;
  };

  public type StudentProfile = {
    name : Text;
    username : Text;
    school : Text;
    studentClass : Nat;
    password : Password;
  };

  public type ParentProfile = {
    name : Text;
    username : Text;
    linkedStudentUsername : Text;
    password : Password;
  };

  public type Subject = {
    id : Nat;
    name : Text;
  };

  public type Chapter = {
    id : Nat;
    subjectId : Nat;
    name : Text;
    weightage : Nat;
    completed : Bool;
  };

  public type Note = {
    id : Nat;
    chapterId : Nat;
    content : Text;
    imageData : ?Text;
    createdAt : Time.Time;
  };

  public type Question = {
    id : Nat;
    chapterId : Nat;
    subjectId : Nat;
    questionText : Text;
    answer : Text;
  };

  public type PlannerTask = {
    id : Nat;
    title : Text;
    description : Text;
    date : Time.Time;
    startTime : Text;
    completed : Bool;
  };

  public type Reminder = {
    id : Nat;
    text : Text;
    dateTime : Time.Time;
  };

  public type Target = {
    id : Nat;
    title : Text;
    description : Text;
    deadline : Time.Time;
    completed : Bool;
  };

  public type MCQQuestion = {
    id : Nat;
    questionText : Text;
    options : [Text];
    correctOption : Nat;
  };

  public type MockTest = {
    id : Nat;
    name : Text;
    subjectId : Nat;
    questions : [MCQQuestion];
  };

  public type QuestionResult = {
    questionId : Nat;
    questionText : Text;
    selectedOption : Nat;
    correctOption : Nat;
    isCorrect : Bool;
  };

  public type TestReport = {
    testId : Nat;
    testName : Text;
    score : Nat;
    total : Nat;
    percentage : Nat;
    timeTaken : Int;
    results : [QuestionResult];
  };

  public type TestAttempt = {
    id : Nat;
    testId : Nat;
    report : TestReport;
    attemptedAt : Time.Time;
  };

  public type RevisionTask = {
    id : Nat;
    chapterId : Nat;
    subjectId : Nat;
    dueDate : Time.Time;
    completed : Bool;
    revisionNumber : Nat;
    plannerTaskId : ?Nat;
  };

  public type Flashcard = {
    id : Nat;
    chapterId : Nat;
    subjectId : Nat;
    front : Text;
    back : Text;
    learned : Bool;
  };

  public type StudyStreak = {
    currentStreak : Nat;
    lastActiveDate : Time.Time;
    topStreak : Nat;
  };

  public type UserAchievement = {
    id : Nat;
    achievementType : Text;
    achievedAt : Time.Time;
  };

  public type SubjectProgress = {
    subjectId : Nat;
    subjectName : Text;
    totalChapters : Nat;
    completedChapters : Nat;
  };

  public type ProgressSummary = {
    subjectProgress : [SubjectProgress];
    totalTasksCompleted : Nat;
    totalTasks : Nat;
    totalTargetsAchieved : Nat;
    totalTargets : Nat;
    mockTestAverageScore : Nat;
    totalMockTestsAttempted : Nat;
  };

  public type PersonalBest = {
    highestScorePerSubject : [(Nat, Nat)];
    fastestTestTime : Int;
    totalQuestionsPracticed : Nat;
    totalChaptersCompleted : Nat;
    longestStreak : Nat;
    rankLabel : Text;
  };

  public type FeedbackType = {
    #comment;
    #appreciate;
    #scold;
  };

  public type StudentFeedback = {
    id : Nat;
    parent : Principal;
    student : Principal;
    feedbackType : FeedbackType;
    message : Text;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
    username : Text;
    school : Text;
    studentClass : Nat;
  };

  public type ChatMessage = {
    id : Nat;
    senderId : Principal;
    senderRole : Text;
    content : Text;
    timestamp : Time.Time;
    isRead : Bool;
  };

  public type PresenceInfo = {
    lastSeen : Time.Time;
    isOnline : Bool;
  };

  public type TypingStatus = {
    userId : Principal;
    isTyping : Bool;
    timestamp : Time.Time;
  };

  // Persistent state variables
  let chatMessages = List.empty<ChatMessage>();
  let userPresence = Map.empty<Principal, PresenceInfo>();
  let typingStatus = Map.empty<Principal, TypingStatus>();

  let studentProfiles = Map.empty<Principal, StudentProfile>();
  let parentProfiles = Map.empty<Text, ParentProfile>();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userSubjects = Map.empty<Principal, [Subject]>();
  let userChapters = Map.empty<Principal, [Chapter]>();
  let userNotes = Map.empty<Principal, [Note]>();
  let userQuestions = Map.empty<Principal, [Question]>();
  let userPlannerTasks = Map.empty<Principal, [PlannerTask]>();
  let userReminders = Map.empty<Principal, [Reminder]>();
  let userTargets = Map.empty<Principal, [Target]>();
  let userMockTests = Map.empty<Principal, [MockTest]>();
  let userTestAttempts = Map.empty<Principal, [TestAttempt]>();
  let userFlashcards = Map.empty<Principal, [Flashcard]>();
  let userRevisionTasks = Map.empty<Principal, [RevisionTask]>();
  let userStudyStreaks = Map.empty<Principal, StudyStreak>();
  let userAchievements = Map.empty<Principal, [UserAchievement]>();
  let userStudentFeedback = Map.empty<Principal, [StudentFeedback]>();

  var subjectIdCounter : Nat = 0;
  var chapterIdCounter : Nat = 0;
  var noteIdCounter : Nat = 0;
  var questionIdCounter : Nat = 0;
  var plannerTaskIdCounter : Nat = 0;
  var reminderIdCounter : Nat = 0;
  var targetIdCounter : Nat = 0;
  var mockTestIdCounter : Nat = 0;
  var testAttemptIdCounter : Nat = 0;
  var revisionIdCounter : Nat = 0;
  var flashcardIdCounter : Nat = 0;
  var achievementIdCounter : Nat = 0;
  var studentFeedbackIdCounter : Nat = 0;
  var messageIdCounter : Nat = 0;

  // New persistent user data store (username -> dataType -> jsonBlob)
  let userDataStore = Map.empty<Text, Map.Map<Text, Text>>();

  func oneDayNs() : Int { 86_400_000_000_000 };

  func dayTimestamp(t : Time.Time) : Int {
    let d = oneDayNs();
    (t / d) * d;
  };

  func updateStreak(caller : Principal) {
    let now = Time.now();
    let todayTs = dayTimestamp(now);
    let streak = switch (userStudyStreaks.get(caller)) {
      case (?s) { s };
      case (null) { { currentStreak = 0; lastActiveDate = 0; topStreak = 0 } };
    };
    let lastDay = dayTimestamp(streak.lastActiveDate);
    if (lastDay == todayTs) { return };
    let yesterday = todayTs - oneDayNs();
    let newStreak : Nat = if (lastDay == yesterday) { streak.currentStreak + 1 } else { 1 };
    let newTop = if (newStreak > streak.topStreak) { newStreak } else { streak.topStreak };
    userStudyStreaks.add(caller, { currentStreak = newStreak; lastActiveDate = now; topStreak = newTop });

    let milestones = [3, 7, 30];
    let existing = switch (userAchievements.get(caller)) {
      case (?a) { a };
      case (null) { [] };
    };
    var updated = existing;
    for (m in milestones.vals()) {
      if (newStreak == m) {
        let aType = m.toText() # "-day-streak";
        let alreadyHas = existing.any(func(a : UserAchievement) : Bool { a.achievementType == aType });
        if (not alreadyHas) {
          achievementIdCounter += 1;
          let ach : UserAchievement = {
            id = achievementIdCounter;
            achievementType = aType;
            achievedAt = now;
          };
          updated := updated.concat([ach]);
        };
      };
    };
    userAchievements.add(caller, updated);
  };

  func scheduleRevisionTasks(caller : Principal, chapterId : Nat, subjectId : Nat) {
    let now = Time.now();
    let intervals : [Nat] = [1, 3, 7, 21];
    let existing = switch (userRevisionTasks.get(caller)) {
      case (?r) { r };
      case (null) { [] };
    };
    var updated = existing;
    var revNum : Nat = 0;
    for (days in intervals.vals()) {
      revNum += 1;
      let dueDate = now + (days * 86_400_000_000_000);
      revisionIdCounter += 1;

      plannerTaskIdCounter += 1;
      let plannerTask : PlannerTask = {
        id = plannerTaskIdCounter;
        title = "Revision #" # revNum.toText();
        description = "Spaced repetition revision for chapter";
        date = dueDate;
        startTime = "09:00";
        completed = false;
      };
      let existingPlanner = switch (userPlannerTasks.get(caller)) {
        case (?t) { t };
        case (null) { [] };
      };
      userPlannerTasks.add(caller, existingPlanner.concat([plannerTask]));

      let revTask : RevisionTask = {
        id = revisionIdCounter;
        chapterId;
        subjectId;
        dueDate;
        completed = false;
        revisionNumber = revNum;
        plannerTaskId = ?plannerTaskIdCounter;
      };
      updated := updated.concat([revTask]);
    };
    userRevisionTasks.add(caller, updated);
  };

  // Student account registration with password - open to all (guests can register)
  public shared ({ caller }) func registerStudent(username : Text, name : Text, school : Text, studentClass : Nat, password : Text) : async () {
    let existing = studentProfiles.values().any(func(profile) { profile.username == username });
    if (existing) {
      Runtime.trap("Username already taken");
    };

    let profile : StudentProfile = {
      name;
      username;
      school;
      studentClass;
      password = { hash = password };
    };

    studentProfiles.add(caller, profile);

    let subjectNames = [
      "Mathematics",
      "English",
      "Science",
      "Social Science (SST)",
      "Sanskrit",
      "Information Technology (IT)",
    ];
    var seeded : [Subject] = [];
    for (sname in subjectNames.vals()) {
      subjectIdCounter += 1;
      seeded := seeded.concat([{ id = subjectIdCounter; name = sname }]);
    };
    userSubjects.add(caller, seeded);

    userStudyStreaks.add(caller, { currentStreak = 0; lastActiveDate = 0; topStreak = 0 });
    userAchievements.add(caller, []);
  };

  // Parent account registration - open to all (guests can register)
  public shared ({ caller }) func registerParent(username : Text, name : Text, linkedStudentUsername : Text, password : Text) : async () {
    switch (parentProfiles.get(username)) {
      case (?_) { Runtime.trap("Username already taken") };
      case (null) {};
    };

    let profile : ParentProfile = {
      name;
      username;
      linkedStudentUsername;
      password = { hash = password };
    };
    parentProfiles.add(username, profile);
  };

  // Query parent profile by username - only accessible to registered users (password hash is sensitive)
  public query ({ caller }) func getParentByUsername(username : Text) : async ?ParentProfile {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can look up parent profiles");
    };
    switch (parentProfiles.get(username)) {
      case (?profile) { ?profile };
      case (null) { null };
    };
  };

  // Query student profile by username - returns full profile including password hash
  // REQUIRES AUTHENTICATION to protect password data
  public query ({ caller }) func getStudentByUsername(username : Text) : async ?StudentProfile {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can look up student profiles");
    };
    studentProfiles.values().find(
      func(s) { s.username == username }
    );
  };

  // Query parent profile by username - returns full profile including password hash
  // REQUIRES AUTHENTICATION to protect password data
  public query ({ caller }) func getParentProfileByUsername(username : Text) : async ?ParentProfile {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can look up parent profiles");
    };
    parentProfiles.get(username);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Feedback panel methods
  public shared ({ caller }) func addStudentFeedback(student : Principal, message : Text, feedbackType : FeedbackType) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can add feedback");
    };
    studentFeedbackIdCounter += 1;

    let newFeedback : StudentFeedback = {
      id = studentFeedbackIdCounter;
      parent = caller;
      student;
      feedbackType;
      message;
      createdAt = Time.now();
    };

    let existing = switch (userStudentFeedback.get(student)) {
      case (?f) { f };
      case (null) { [] };
    };

    let updated = existing.concat([newFeedback]);
    userStudentFeedback.add(student, updated);
    studentFeedbackIdCounter;
  };

  public query ({ caller }) func getFeedbackForStudent(student : Principal) : async [StudentFeedback] {
    if (caller != student and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own feedback");
    };
    switch (userStudentFeedback.get(student)) {
      case (?feedback) { feedback };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getFeedbackById(feedbackId : Nat) : async StudentFeedback {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view feedback");
    };
    var found : ?StudentFeedback = null;
    for ((_, entries) in userStudentFeedback.entries()) {
      for (f in entries.vals()) {
        if (f.id == feedbackId) {
          found := ?f;
        };
      };
    };
    switch (found) {
      case (?f) {
        if (caller != f.student and caller != f.parent and not Authorization.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You do not have access to this feedback");
        };
        f;
      };
      case (null) {
        Runtime.trap("No feedback found with that ID");
      };
    };
  };

  public query ({ caller }) func getFeedbackFromParent(parent : Principal) : async [StudentFeedback] {
    if (caller != parent and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own submitted feedback");
    };
    var result : [StudentFeedback] = [];
    for ((_, entries) in userStudentFeedback.entries()) {
      for (f in entries.vals()) {
        if (f.parent == parent) {
          result := result.concat([f]);
        };
      };
    };
    result;
  };

  public shared ({ caller }) func deleteFeedback(feedbackId : Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can delete feedback");
    };
    var found : ?StudentFeedback = null;
    for ((_, entries) in userStudentFeedback.entries()) {
      for (f in entries.vals()) {
        if (f.id == feedbackId) {
          found := ?f;
        };
      };
    };
    let feedbackRecord = switch (found) {
      case (?f) { f };
      case (null) { Runtime.trap("No feedback found with that ID") };
    };
    if (feedbackRecord.parent != caller and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the parent who submitted the feedback can delete it");
    };
    let existingFeedback = switch (userStudentFeedback.get(feedbackRecord.student)) {
      case (?f) { f };
      case (null) { Runtime.trap("No feedback found for this student") };
    };
    let filtered = existingFeedback.filter(func(f : StudentFeedback) : Bool { f.id != feedbackId });
    userStudentFeedback.add(feedbackRecord.student, filtered);
  };

  public shared ({ caller }) func updateFeedback(feedbackId : Nat, updatedMessage : Text, feedbackType : FeedbackType) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can update feedback");
    };
    var found : ?StudentFeedback = null;
    for ((_, entries) in userStudentFeedback.entries()) {
      for (f in entries.vals()) {
        if (f.id == feedbackId) {
          found := ?f;
        };
      };
    };
    let feedbackRecord = switch (found) {
      case (?f) { f };
      case (null) { Runtime.trap("No feedback found with that ID") };
    };
    if (feedbackRecord.parent != caller and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the parent who submitted the feedback can update it");
    };
    let existingFeedback = switch (userStudentFeedback.get(feedbackRecord.student)) {
      case (?f) { f };
      case (null) { Runtime.trap("No feedback found for this student") };
    };
    let mapped = existingFeedback.map(func(f : StudentFeedback) : StudentFeedback {
      if (f.id == feedbackId) {
        { f with message = updatedMessage; feedbackType };
      } else { f };
    });
    userStudentFeedback.add(feedbackRecord.student, mapped);
  };

  // Message persistence methods
  public shared ({ caller }) func sendMessage(recipient : Principal, senderRole : Text, content : Text) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can send messages");
    };
    if (content == "") {
      Runtime.trap("Cannot send empty message");
    };
    messageIdCounter += 1;
    let newMessage : ChatMessage = {
      id = messageIdCounter;
      senderId = caller;
      senderRole;
      content;
      timestamp = Time.now();
      isRead = false;
    };
    chatMessages.add(newMessage);
  };

  // Returns messages between the caller and the specified user, plus online status of that user
  public query ({ caller }) func getMessages(user : Principal) : async ([ChatMessage], Bool) {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view messages");
    };
    let now = Time.now();
    let filtered = chatMessages.toArray().filter(
      func(msg : ChatMessage) : Bool {
        (msg.senderId == caller) or (msg.senderId == user)
      }
    );
    let sorted = filtered.sort(
      func(a : ChatMessage, b : ChatMessage) : { #less; #equal; #greater } {
        if (a.timestamp < b.timestamp) { #less }
        else if (a.timestamp == b.timestamp) { #equal }
        else { #greater };
      }
    );
    let isUserOnline = switch (userPresence.get(user)) {
      case (?presence) { (now - presence.lastSeen) < 60_000_000_000 };
      case (null) { false };
    };
    (sorted, isUserOnline);
  };

  // Mark messages from a given sender as read - only the recipient (caller) can mark messages as read
  public shared ({ caller }) func markMessagesRead(sender : Principal) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can mark messages as read");
    };
    let updatedMessages = chatMessages.toArray().map(
      func(msg : ChatMessage) : ChatMessage {
        // Only mark as read if the message was sent TO the caller (caller is the recipient)
        if (msg.senderId == sender) {
          { msg with isRead = true };
        } else {
          msg;
        };
      }
    );
    chatMessages.clear();
    chatMessages.addAll(updatedMessages.values());
  };

  // Presence tracking methods
  public shared ({ caller }) func updatePresence(isOnline : Bool) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can update presence");
    };
    userPresence.add(caller, {
      lastSeen = Time.now();
      isOnline;
    });
  };

  public query ({ caller }) func getPresence(user : Principal) : async PresenceInfo {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view presence");
    };
    switch (userPresence.get(user)) {
      case (?presence) { presence };
      case (null) {
        { lastSeen = 0; isOnline = false };
      };
    };
  };

  // Typing indicator methods
  public shared ({ caller }) func setTyping(isTyping : Bool) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can set typing status");
    };
    let status : TypingStatus = {
      userId = caller;
      isTyping;
      timestamp = Time.now();
    };
    typingStatus.add(caller, status);
  };

  public query ({ caller }) func getTypingStatus(user : Principal) : async Bool {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view typing status");
    };
    switch (typingStatus.get(user)) {
      case (?status) {
        let now = Time.now();
        let timeDiff : Int = (now - status.timestamp) / 1_000_000_000;
        status.isTyping and timeDiff < 3;
      };
      case (null) { false };
    };
  };

  // ------ NEW METHODS FOR GENERIC USER DATA STORAGE (NO AUTH AS REQUESTED) ------
  // WARNING: These endpoints have no authorization as per user requirements.
  // This means anyone can read/write any user's data if they know the username.
  // This is inherently insecure but implemented as specified.

  /// Save user data (username + dataType) JSON blob
  public shared ({ caller }) func saveUserData(username : Text, dataType : Text, jsonBlob : Text) : async () {
    if (username == "" or dataType == "" or jsonBlob == "") {
      Runtime.trap("Username, dataType, and jsonBlob must not be empty");
    };

    let userMap = switch (userDataStore.get(username)) {
      case (?map) { map };
      case (null) {
        let newMap = Map.empty<Text, Text>();
        userDataStore.add(username, newMap);
        newMap;
      };
    };
    userMap.add(dataType, jsonBlob);
  };

  /// Get user data by username + dataType
  public query ({ caller }) func getUserData(username : Text, dataType : Text) : async ?Text {
    if (username == "" or dataType == "") {
      Runtime.trap("Username and dataType must not be empty");
    };

    switch (userDataStore.get(username)) {
      case (?userMap) { userMap.get(dataType) };
      case (null) { null };
    };
  };

  /// List all data types stored for a given username
  public query ({ caller }) func listUserDataTypes(username : Text) : async [Text] {
    if (username == "") {
      Runtime.trap("Username must not be empty");
    };

    switch (userDataStore.get(username)) {
      case (?userMap) {
        let iter = userMap.keys();
        iter.toArray();
      };
      case (null) { [] };
    };
  };
};
