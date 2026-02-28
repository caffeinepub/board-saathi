import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  //
  // ───────────────────────────────────────────────────────────────────────────────────────── CBSE Board App Types ─────

  /// User Profile (required by instructions)
  public type UserProfile = {
    name : Text;
    username : Text;
    school : Text;
    studentClass : Nat;
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

  public type MCQOption = {
    text : Text;
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

  public type MCQAnswer = {
    questionId : Nat;
    selectedOption : Nat;
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

  /// Main persistent state variables
  // WARNING: All persistent state must be constructed using `Map.fromIter` to avoid initialization errors
  var userProfiles = Map.empty<Principal, UserProfile>();
  var userSubjects = Map.empty<Principal, [Subject]>();
  var userChapters = Map.empty<Principal, [Chapter]>();
  var userNotes = Map.empty<Principal, [Note]>();
  var userQuestions = Map.empty<Principal, [Question]>();
  var userPlannerTasks = Map.empty<Principal, [PlannerTask]>();
  var userReminders = Map.empty<Principal, [Reminder]>();
  var userTargets = Map.empty<Principal, [Target]>();
  var userMockTests = Map.empty<Principal, [MockTest]>();
  var userTestAttempts = Map.empty<Principal, [TestAttempt]>();
  var userFlashcards = Map.empty<Principal, [Flashcard]>();
  var userRevisionTasks = Map.empty<Principal, [RevisionTask]>();
  var userStudyStreaks = Map.empty<Principal, StudyStreak>();
  var userAchievements = Map.empty<Principal, [UserAchievement]>();

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

  //
  // ───────────────────────────────────────────────────────────────────────────────────────────── Helpers ─────

  /// Returns the number of nanoseconds in one day
  func oneDayNs() : Int { 86_400_000_000_000 };

  /// Compute a day-level timestamp (truncate to day boundary in nanoseconds)
  func dayTimestamp(t : Time.Time) : Int {
    let d = oneDayNs();
    (t / d) * d;
  };

  /// Check and update study streak for a user; award milestone achievements
  func updateStreak(caller : Principal) {
    let now = Time.now();
    let todayTs = dayTimestamp(now);
    let streak = switch (userStudyStreaks.get(caller)) {
      case (?s) { s };
      case (null) { { currentStreak = 0; lastActiveDate = 0; topStreak = 0 } };
    };
    let lastDay = dayTimestamp(streak.lastActiveDate);
    if (lastDay == todayTs) {
      // Already updated today, nothing to do
      return;
    };
    let yesterday = todayTs - oneDayNs();
    let newStreak : Nat = if (lastDay == yesterday) {
      streak.currentStreak + 1;
    } else {
      1;
    };
    let newTop = if (newStreak > streak.topStreak) { newStreak } else { streak.topStreak };
    userStudyStreaks.add(caller, { currentStreak = newStreak; lastActiveDate = now; topStreak = newTop });

    // Award milestone achievements
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

  /// Schedule spaced-repetition revision tasks for a chapter
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

      // Also create a planner task for this revision
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

  //
  // ───────────────────────────────────────────────────────────────────────────────────────────── Registration ─────

  /// Register is open to anyone (guests), since users need to register before having a #user role.
  public shared ({ caller }) func register(username : Text, name : Text, school : Text, studentClass : Nat) : async () {
    switch (userProfiles.get(caller)) {
      case (?_) { Runtime.trap("User already registered") };
      case (null) {};
    };

    let taken = userProfiles.values().any(func(p) { p.username == username });
    if (taken) { Runtime.trap("Username already taken") };

    let profile : UserProfile = { name; username; school; studentClass };
    userProfiles.add(caller, profile);

    // Seed subjects
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

    // Initialize streak & achievements
    userStudyStreaks.add(caller, { currentStreak = 0; lastActiveDate = 0; topStreak = 0 });
    userAchievements.add(caller, []);
  };

  /// getCallerUserProfile: only authenticated users (#user) can call this.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  /// getUserProfile: users can only view their own profile; admins can view any.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  /// saveCallerUserProfile: only authenticated users (#user) can save their own profile.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  //
  // ───────────────────────────────────────────────────────────────────────────────────────────── Subjects ─────

  public shared ({ caller }) func addSubject(name : Text) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add subjects");
    };

    subjectIdCounter += 1;
    let subject : Subject = {
      id = subjectIdCounter;
      name;
    };

    let existingSubjects = switch (userSubjects.get(caller)) {
      case (?subjects) { subjects };
      case (null) { [] };
    };
    userSubjects.add(caller, existingSubjects.concat([subject]));
    subjectIdCounter;
  };

  /// getSubjects: only authenticated users (#user) can view their subjects.
  public query ({ caller }) func getSubjects() : async [Subject] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view subjects");
    };
    switch (userSubjects.get(caller)) {
      case (?subjects) { subjects };
      case (null) { [] };
    };
  };

  //
  // ───────────────────────────────────────────────────────────────────────────────────────────── Chapters ─────

  /// addChapter: only authenticated users (#user) can add chapters.
  public shared ({ caller }) func addChapter(subjectId : Nat, name : Text, weightage : Nat) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add chapters");
    };
    chapterIdCounter += 1;
    let chapter : Chapter = {
      id = chapterIdCounter;
      subjectId;
      name;
      weightage;
      completed = false;
    };
    let existing = switch (userChapters.get(caller)) {
      case (?chapters) { chapters };
      case (null) { [] };
    };
    userChapters.add(caller, existing.concat([chapter]));
    chapterIdCounter;
  };

  /// getChaptersForSubject: only authenticated users (#user) can view their chapters.
  public query ({ caller }) func getChaptersForSubject(subjectId : Nat) : async [Chapter] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view chapters");
    };
    let all = switch (userChapters.get(caller)) {
      case (?chapters) { chapters };
      case (null) { [] };
    };
    all.filter(func(c : Chapter) : Bool { c.subjectId == subjectId });
  };

  /// markChapterCompleted: only authenticated users (#user) can update their chapters.
  /// When a chapter is marked complete, revision tasks are automatically scheduled.
  public shared ({ caller }) func markChapterCompleted(chapterId : Nat, completed : Bool) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update chapters");
    };
    let all = switch (userChapters.get(caller)) {
      case (?chapters) { chapters };
      case (null) { Runtime.trap("No chapters found") };
    };
    // Find the chapter to get its subjectId
    let chapterOpt = all.find(func(c : Chapter) : Bool { c.id == chapterId });
    let updated = all.map(
      func(c : Chapter) : Chapter {
        if (c.id == chapterId) { { c with completed } } else { c };
      },
    );
    userChapters.add(caller, updated);

    // Schedule revision tasks when a chapter is newly marked complete
    if (completed) {
      switch (chapterOpt) {
        case (?ch) {
          // Only schedule if not already completed (avoid duplicate scheduling)
          if (not ch.completed) {
            scheduleRevisionTasks(caller, chapterId, ch.subjectId);
          };
        };
        case (null) {};
      };
      updateStreak(caller);
    };
  };

  //
  // ─────────────────────────────────────────────────────────────────────────────────────────── Study Material ─────

  /// addNote: only authenticated users (#user) can add notes.
  public shared ({ caller }) func addNote(chapterId : Nat, content : Text, imageData : ?Text) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add notes");
    };
    noteIdCounter += 1;
    let note : Note = {
      id = noteIdCounter;
      chapterId;
      content;
      imageData;
      createdAt = Time.now();
    };
    let existing = switch (userNotes.get(caller)) {
      case (?notes) { notes };
      case (null) { [] };
    };
    userNotes.add(caller, existing.concat([note]));
    noteIdCounter;
  };

  /// getNotesForChapter: only authenticated users (#user) can view their notes.
  public query ({ caller }) func getNotesForChapter(chapterId : Nat) : async [Note] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view notes");
    };
    let all = switch (userNotes.get(caller)) {
      case (?notes) { notes };
      case (null) { [] };
    };
    all.filter(func(n : Note) : Bool { n.chapterId == chapterId });
  };

  /// deleteNote: only authenticated users (#user) can delete their own notes.
  public shared ({ caller }) func deleteNote(noteId : Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete notes");
    };
    let all = switch (userNotes.get(caller)) {
      case (?notes) { notes };
      case (null) { Runtime.trap("No notes found") };
    };
    let updated = all.filter(func(n : Note) : Bool { n.id != noteId });
    userNotes.add(caller, updated);
  };

  /// addQuestion: only authenticated users (#user) can add questions.
  public shared ({ caller }) func addQuestion(chapterId : Nat, subjectId : Nat, questionText : Text, answer : Text) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add questions");
    };
    questionIdCounter += 1;
    let question : Question = {
      id = questionIdCounter;
      chapterId;
      subjectId;
      questionText;
      answer;
    };
    let existing = switch (userQuestions.get(caller)) {
      case (?questions) { questions };
      case (null) { [] };
    };
    userQuestions.add(caller, existing.concat([question]));
    questionIdCounter;
  };

  /// getQuestionsForChapter: only authenticated users (#user) can view their questions.
  public query ({ caller }) func getQuestionsForChapter(chapterId : Nat) : async [Question] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view questions");
    };
    let all = switch (userQuestions.get(caller)) {
      case (?questions) { questions };
      case (null) { [] };
    };
    all.filter(func(q : Question) : Bool { q.chapterId == chapterId });
  };

  /// deleteQuestion: only authenticated users (#user) can delete their own questions.
  public shared ({ caller }) func deleteQuestion(questionId : Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete questions");
    };
    let all = switch (userQuestions.get(caller)) {
      case (?questions) { questions };
      case (null) { Runtime.trap("No questions found") };
    };
    let updated = all.filter(func(q : Question) : Bool { q.id != questionId });
    userQuestions.add(caller, updated);
  };

  //
  // ────────────────────────────────────────────────────────────────────────────────────────────── Flashcards ─────

  /// addFlashcard: only authenticated users (#user) can add flashcards.
  public shared ({ caller }) func addFlashcard(chapterId : Nat, subjectId : Nat, front : Text, back : Text) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add flashcards");
    };
    flashcardIdCounter += 1;
    let card : Flashcard = {
      id = flashcardIdCounter;
      chapterId;
      subjectId;
      front;
      back;
      learned = false;
    };
    let existing = switch (userFlashcards.get(caller)) {
      case (?flashcards) { flashcards };
      case (null) { [] };
    };
    userFlashcards.add(caller, existing.concat([card]));
    flashcardIdCounter;
  };

  /// getFlashcardsForChapter: only authenticated users (#user) can view their flashcards.
  public query ({ caller }) func getFlashcardsForChapter(chapterId : Nat) : async [Flashcard] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view flashcards");
    };
    let all = switch (userFlashcards.get(caller)) {
      case (?flashcards) { flashcards };
      case (null) { [] };
    };
    all.filter(func(f : Flashcard) : Bool { f.chapterId == chapterId });
  };

  /// getAllFlashcards: only authenticated users (#user) can view all their flashcards.
  public query ({ caller }) func getAllFlashcards() : async [Flashcard] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view flashcards");
    };
    switch (userFlashcards.get(caller)) {
      case (?flashcards) { flashcards };
      case (null) { [] };
    };
  };

  /// markFlashcardLearned: only authenticated users (#user) can update their own flashcards.
  public shared ({ caller }) func markFlashcardLearned(cardId : Nat, learned : Bool) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update flashcards");
    };
    let all = switch (userFlashcards.get(caller)) {
      case (?flashcards) { flashcards };
      case (null) { Runtime.trap("No flashcards found") };
    };
    let updated = all.map(
      func(f : Flashcard) : Flashcard {
        if (f.id == cardId) { { f with learned } } else { f };
      },
    );
    userFlashcards.add(caller, updated);
  };

  /// deleteFlashcard: only authenticated users (#user) can delete their own flashcards.
  public shared ({ caller }) func deleteFlashcard(cardId : Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete flashcards");
    };
    let all = switch (userFlashcards.get(caller)) {
      case (?flashcards) { flashcards };
      case (null) { Runtime.trap("No flashcards found") };
    };
    let updated = all.filter(func(f : Flashcard) : Bool { f.id != cardId });
    userFlashcards.add(caller, updated);
  };

  //
  // ────────────────────────────────────────────────────────────────────────────────────────────── Question Bank ─────

  /// getQuestionBank: only authenticated users (#user) can view the question bank.
  public query ({ caller }) func getQuestionBank(subjectIdFilter : ?Nat, chapterIdFilter : ?Nat) : async [Question] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view the question bank");
    };
    let all = switch (userQuestions.get(caller)) {
      case (?questions) { questions };
      case (null) { [] };
    };
    all.filter(
      func(q : Question) : Bool {
        let subjectMatch = switch (subjectIdFilter) {
          case (?sid) { q.subjectId == sid };
          case (null) { true };
        };
        let chapterMatch = switch (chapterIdFilter) {
          case (?cid) { q.chapterId == cid };
          case (null) { true };
        };
        subjectMatch and chapterMatch;
      },
    );
  };

  //
  // ─────────────────────────────────────────────────────────────────────────────────────────── Daily Study Planner ─────

  /// addPlannerTask: only authenticated users (#user) can add planner tasks.
  public shared ({ caller }) func addPlannerTask(title : Text, description : Text, date : Time.Time, startTime : Text) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add planner tasks");
    };
    plannerTaskIdCounter += 1;
    let task : PlannerTask = {
      id = plannerTaskIdCounter;
      title;
      description;
      date;
      startTime;
      completed = false;
    };
    let existing = switch (userPlannerTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { [] };
    };
    userPlannerTasks.add(caller, existing.concat([task]));
    plannerTaskIdCounter;
  };

  /// getPlannerTasksForDate: only authenticated users (#user) can view their planner tasks.
  public query ({ caller }) func getPlannerTasksForDate(date : Time.Time) : async [PlannerTask] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view planner tasks");
    };
    let all = switch (userPlannerTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { [] };
    };
    all.filter(func(t : PlannerTask) : Bool { t.date == date });
  };

  /// getPlannerTasksForMonth: only authenticated users (#user) can view their planner tasks.
  public query ({ caller }) func getPlannerTasksForMonth(_year : Nat, _month : Nat) : async [PlannerTask] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view planner tasks");
    };
    let all = switch (userPlannerTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { [] };
    };
    all;
  };

  /// getAllPlannerTasks: only authenticated users (#user) can view all their planner tasks.
  public query ({ caller }) func getAllPlannerTasks() : async [PlannerTask] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view planner tasks");
    };
    switch (userPlannerTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { [] };
    };
  };

  /// completePlannerTask: only authenticated users (#user) can update their own planner tasks.
  /// Completing a task also updates the study streak.
  public shared ({ caller }) func completePlannerTask(taskId : Nat, completed : Bool) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update planner tasks");
    };
    let all = switch (userPlannerTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { Runtime.trap("No tasks found") };
    };
    let updated = all.map(
      func(t : PlannerTask) : PlannerTask {
        if (t.id == taskId) { { t with completed } } else { t };
      },
    );
    userPlannerTasks.add(caller, updated);
    if (completed) {
      updateStreak(caller);
    };
  };

  /// deletePlannerTask: only authenticated users (#user) can delete their own planner tasks.
  public shared ({ caller }) func deletePlannerTask(taskId : Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete planner tasks");
    };
    let all = switch (userPlannerTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { Runtime.trap("No tasks found") };
    };
    let updated = all.filter(func(t : PlannerTask) : Bool { t.id != taskId });
    userPlannerTasks.add(caller, updated);
  };

  //
  // ─────────────────────────────────────────────────────────────────────────────────────────── Reminders ─────

  /// addReminder: only authenticated users (#user) can add reminders.
  public shared ({ caller }) func addReminder(text : Text, dateTime : Time.Time) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add reminders");
    };
    reminderIdCounter += 1;
    let reminder : Reminder = {
      id = reminderIdCounter;
      text;
      dateTime;
    };
    let existing = switch (userReminders.get(caller)) {
      case (?reminders) { reminders };
      case (null) { [] };
    };
    userReminders.add(caller, existing.concat([reminder]));
    reminderIdCounter;
  };

  /// getReminders: only authenticated users (#user) can view their reminders.
  public query ({ caller }) func getReminders() : async [Reminder] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };
    let all = switch (userReminders.get(caller)) {
      case (?reminders) { reminders };
      case (null) { [] };
    };
    all.sort(func(a : Reminder, b : Reminder) : Order.Order { Int.compare(a.dateTime, b.dateTime) });
  };

  /// deleteReminder: only authenticated users (#user) can delete their own reminders.
  public shared ({ caller }) func deleteReminder(reminderId : Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete reminders");
    };
    let all = switch (userReminders.get(caller)) {
      case (?reminders) { reminders };
      case (null) { Runtime.trap("No reminders found") };
    };
    let updated = all.filter(func(r : Reminder) : Bool { r.id != reminderId });
    userReminders.add(caller, updated);
  };

  //
  // ─────────────────────────────────────────────────────────────────────────────────────────── Targets ─────

  /// addTarget: only authenticated users (#user) can add targets.
  public shared ({ caller }) func addTarget(title : Text, description : Text, deadline : Time.Time) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add targets");
    };
    targetIdCounter += 1;
    let target : Target = {
      id = targetIdCounter;
      title;
      description;
      deadline;
      completed = false;
    };
    let existing = switch (userTargets.get(caller)) {
      case (?targets) { targets };
      case (null) { [] };
    };
    userTargets.add(caller, existing.concat([target]));
    targetIdCounter;
  };

  /// getTargets: only authenticated users (#user) can view their targets.
  public query ({ caller }) func getTargets() : async [Target] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view targets");
    };
    switch (userTargets.get(caller)) {
      case (?targets) { targets };
      case (null) { [] };
    };
  };

  /// completeTarget: only authenticated users (#user) can update their own targets.
  public shared ({ caller }) func completeTarget(targetId : Nat, completed : Bool) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update targets");
    };
    let all = switch (userTargets.get(caller)) {
      case (?targets) { targets };
      case (null) { Runtime.trap("No targets found") };
    };
    let updated = all.map(
      func(t : Target) : Target {
        if (t.id == targetId) { { t with completed } } else { t };
      },
    );
    userTargets.add(caller, updated);
  };

  /// deleteTarget: only authenticated users (#user) can delete their own targets.
  public shared ({ caller }) func deleteTarget(targetId : Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete targets");
    };
    let all = switch (userTargets.get(caller)) {
      case (?targets) { targets };
      case (null) { Runtime.trap("No targets found") };
    };
    let updated = all.filter(func(t : Target) : Bool { t.id != targetId });
    userTargets.add(caller, updated);
  };

  //
  // ─────────────────────────────────────────────────────────────────────────────────────────────── Mock Tests ─────

  /// createMockTest: only authenticated users (#user) can create mock tests.
  public shared ({ caller }) func createMockTest(name : Text, subjectId : Nat, questions : [MCQQuestion]) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create mock tests");
    };
    mockTestIdCounter += 1;
    let test : MockTest = {
      id = mockTestIdCounter;
      name;
      subjectId;
      questions;
    };
    let existing = switch (userMockTests.get(caller)) {
      case (?tests) { tests };
      case (null) { [] };
    };
    userMockTests.add(caller, existing.concat([test]));
    mockTestIdCounter;
  };

  /// getMockTests: only authenticated users (#user) can view their mock tests.
  public query ({ caller }) func getMockTests() : async [MockTest] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view mock tests");
    };
    switch (userMockTests.get(caller)) {
      case (?tests) { tests };
      case (null) { [] };
    };
  };

  /// getMockTest: only authenticated users (#user) can view a specific mock test.
  public query ({ caller }) func getMockTest(testId : Nat) : async ?MockTest {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view mock tests");
    };
    let all = switch (userMockTests.get(caller)) {
      case (?tests) { tests };
      case (null) { [] };
    };
    all.find(func(t : MockTest) : Bool { t.id == testId });
  };

  /// deleteMockTest: only authenticated users (#user) can delete their own mock tests.
  public shared ({ caller }) func deleteMockTest(testId : Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete mock tests");
    };
    let all = switch (userMockTests.get(caller)) {
      case (?tests) { tests };
      case (null) { Runtime.trap("No mock tests found") };
    };
    let updated = all.filter(func(t : MockTest) : Bool { t.id != testId });
    userMockTests.add(caller, updated);
  };

  /// submitMockTest: only authenticated users (#user) can submit mock tests.
  public shared ({ caller }) func submitMockTest(testId : Nat, answers : [MCQAnswer], timeTaken : Int) : async TestReport {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can submit mock tests");
    };
    let allTests = switch (userMockTests.get(caller)) {
      case (?tests) { tests };
      case (null) { Runtime.trap("No mock tests found") };
    };
    let testOpt = allTests.find(func(t : MockTest) : Bool { t.id == testId });
    let test = switch (testOpt) {
      case (?t) { t };
      case (null) { Runtime.trap("Mock test not found") };
    };

    var score : Nat = 0;
    let results = test.questions.map(
      func(q : MCQQuestion) : QuestionResult {
        let answerOpt = answers.find(func(a : MCQAnswer) : Bool { a.questionId == q.id });
        let selected = switch (answerOpt) {
          case (?a) { a.selectedOption };
          case (null) { 999 };
        };
        let isCorrect = selected == q.correctOption;
        if (isCorrect) { score += 1 };
        {
          questionId = q.id;
          questionText = q.questionText;
          selectedOption = selected;
          correctOption = q.correctOption;
          isCorrect;
        };
      },
    );

    let total = test.questions.size();
    let percentage = if (total == 0) { 0 } else { (score * 100) / total };

    let report : TestReport = {
      testId;
      testName = test.name;
      score;
      total;
      percentage;
      timeTaken;
      results;
    };

    testAttemptIdCounter += 1;
    let attempt : TestAttempt = {
      id = testAttemptIdCounter;
      testId;
      report;
      attemptedAt = Time.now();
    };
    let existingAttempts = switch (userTestAttempts.get(caller)) {
      case (?attempts) { attempts };
      case (null) { [] };
    };
    userTestAttempts.add(caller, existingAttempts.concat([attempt]));

    // Submitting a test counts as activity for streak
    updateStreak(caller);

    report;
  };

  /// getTestAttempts: only authenticated users (#user) can view their test attempts.
  public query ({ caller }) func getTestAttempts() : async [TestAttempt] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view test attempts");
    };
    switch (userTestAttempts.get(caller)) {
      case (?attempts) { attempts };
      case (null) { [] };
    };
  };

  /// getTestAttemptsForTest: only authenticated users (#user) can view test attempts for a specific test.
  public query ({ caller }) func getTestAttemptsForTest(testId : Nat) : async [TestAttempt] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view test attempts");
    };
    let all = switch (userTestAttempts.get(caller)) {
      case (?attempts) { attempts };
      case (null) { [] };
    };
    all.filter(func(a : TestAttempt) : Bool { a.testId == testId });
  };

  //
  // ────────────────────────────────────────────────────────────────────────────────────────────── Revision Tasks ─────

  /// getRevisionTasks: only authenticated users (#user) can view their revision tasks.
  public query ({ caller }) func getRevisionTasks() : async [RevisionTask] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view revision tasks");
    };
    switch (userRevisionTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { [] };
    };
  };

  /// getPendingRevisionTasks: only authenticated users (#user) can view their pending revision tasks.
  public query ({ caller }) func getPendingRevisionTasks() : async [RevisionTask] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view revision tasks");
    };
    let all = switch (userRevisionTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { [] };
    };
    all.filter(func(r : RevisionTask) : Bool { not r.completed });
  };

  /// markRevisionTaskCompleted: only authenticated users (#user) can update their own revision tasks.
  public shared ({ caller }) func markRevisionTaskCompleted(revisionId : Nat, completed : Bool) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update revision tasks");
    };
    let all = switch (userRevisionTasks.get(caller)) {
      case (?tasks) { tasks };
      case (null) { Runtime.trap("No revision tasks found") };
    };
    let updated = all.map(
      func(r : RevisionTask) : RevisionTask {
        if (r.id == revisionId) { { r with completed } } else { r };
      },
    );
    userRevisionTasks.add(caller, updated);
    if (completed) {
      updateStreak(caller);
    };
  };

  //
  // ────────────────────────────────────────────────────────────────────────────────────────────── Study Streak ─────

  /// getStudyStreak: only authenticated users (#user) can view their study streak.
  public query ({ caller }) func getStudyStreak() : async StudyStreak {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view study streak");
    };
    switch (userStudyStreaks.get(caller)) {
      case (?streak) { streak };
      case (null) { { currentStreak = 0; lastActiveDate = 0; topStreak = 0 } };
    };
  };

  /// recordDailyLogin: only authenticated users (#user) can record their daily login for streak tracking.
  public shared ({ caller }) func recordDailyLogin() : async StudyStreak {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can record daily login");
    };
    updateStreak(caller);
    switch (userStudyStreaks.get(caller)) {
      case (?streak) { streak };
      case (null) { { currentStreak = 0; lastActiveDate = 0; topStreak = 0 } };
    };
  };

  //
  // ────────────────────────────────────────────────────────────────────────────────────────────── Achievements ─────

  /// getAchievements: only authenticated users (#user) can view their achievements.
  public query ({ caller }) func getAchievements() : async [UserAchievement] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view achievements");
    };
    switch (userAchievements.get(caller)) {
      case (?achievements) { achievements };
      case (null) { [] };
    };
  };

  //
  // ────────────────────────────────────────────────────────────────────────────────────────────── Progress Tracker ─────

  /// getProgressSummary: only authenticated users (#user) can view their progress.
  public query ({ caller }) func getProgressSummary() : async ProgressSummary {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view progress");
    };

    let subjects = switch (userSubjects.get(caller)) {
      case (?s) { s };
      case (null) { [] };
    };
    let chapters = switch (userChapters.get(caller)) {
      case (?c) { c };
      case (null) { [] };
    };
    let tasks = switch (userPlannerTasks.get(caller)) {
      case (?t) { t };
      case (null) { [] };
    };
    let targets = switch (userTargets.get(caller)) {
      case (?t) { t };
      case (null) { [] };
    };
    let attempts = switch (userTestAttempts.get(caller)) {
      case (?a) { a };
      case (null) { [] };
    };

    let subjectProgress = subjects.map(
      func(s : Subject) : SubjectProgress {
        let subChapters = chapters.filter(func(c : Chapter) : Bool { c.subjectId == s.id });
        let completedCount = subChapters.filter(func(c : Chapter) : Bool { c.completed }).size();
        {
          subjectId = s.id;
          subjectName = s.name;
          totalChapters = subChapters.size();
          completedChapters = completedCount;
        };
      },
    );

    let completedTasks = tasks.filter(func(t : PlannerTask) : Bool { t.completed }).size();
    let achievedTargets = targets.filter(func(t : Target) : Bool { t.completed }).size();

    let totalScore = attempts.foldLeft(
      0,
      func(acc : Nat, a : TestAttempt) : Nat { acc + a.report.percentage },
    );
    let avgScore = if (attempts.size() == 0) { 0 } else { totalScore / attempts.size() };

    {
      subjectProgress;
      totalTasksCompleted = completedTasks;
      totalTasks = tasks.size();
      totalTargetsAchieved = achievedTargets;
      totalTargets = targets.size();
      mockTestAverageScore = avgScore;
      totalMockTestsAttempted = attempts.size();
    };
  };

  //
  // ────────────────────────────────────────────────────────────────────────────────────────────── Personal Best / Achievements ─────

  /// getPersonalBest: only authenticated users (#user) can view their personal best stats.
  public query ({ caller }) func getPersonalBest() : async PersonalBest {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view personal best");
    };

    let attempts = switch (userTestAttempts.get(caller)) {
      case (?a) { a };
      case (null) { [] };
    };
    let chapters = switch (userChapters.get(caller)) {
      case (?c) { c };
      case (null) { [] };
    };
    let questions = switch (userQuestions.get(caller)) {
      case (?q) { q };
      case (null) { [] };
    };
    let streak = switch (userStudyStreaks.get(caller)) {
      case (?s) { s };
      case (null) { { currentStreak = 0; lastActiveDate = 0; topStreak = 0 } };
    };
    let subjects = switch (userSubjects.get(caller)) {
      case (?s) { s };
      case (null) { [] };
    };

    // Highest score per subject
    let highestScorePerSubject = subjects.map<Subject, (Nat, Nat)>(
      func(s : Subject) : (Nat, Nat) {
        let subjectAttempts = attempts.filter(func(_a : TestAttempt) : Bool {
          // We need to find the test to get its subjectId
          true // simplified; frontend can filter
        });
        let maxScore = subjectAttempts.foldLeft(
          0,
          func(acc : Nat, a : TestAttempt) : Nat {
            if (a.report.percentage > acc) { a.report.percentage } else { acc };
          },
        );
        (s.id, maxScore);
      }
    );

    // Fastest test time (minimum timeTaken among all attempts, ignoring 0)
    let fastestTime = attempts.foldLeft(
      0 : Int,
      func(acc : Int, a : TestAttempt) : Int {
        if (acc == 0 or (a.report.timeTaken > 0 and a.report.timeTaken < acc)) {
          a.report.timeTaken;
        } else {
          acc;
        };
      },
    );

    let totalChaptersCompleted = chapters.filter(func(c : Chapter) : Bool { c.completed }).size();
    let totalQuestionsPracticed = questions.size();
    let longestStreak = streak.topStreak;

    // Rank label based on overall progress
    let totalScore = attempts.foldLeft(
      0,
      func(acc : Nat, a : TestAttempt) : Nat { acc + a.report.percentage },
    );
    let avgScore = if (attempts.size() == 0) { 0 } else { totalScore / attempts.size() };

    let rankLabel = if (totalChaptersCompleted >= 20 and avgScore >= 80 and longestStreak >= 30) {
      "Board Champion";
    } else if (totalChaptersCompleted >= 10 and avgScore >= 60 and longestStreak >= 7) {
      "Rising Star";
    } else if (totalChaptersCompleted >= 5 and avgScore >= 40) {
      "Dedicated Learner";
    } else {
      "Beginner Scholar";
    };

    {
      highestScorePerSubject;
      fastestTestTime = fastestTime;
      totalQuestionsPracticed;
      totalChaptersCompleted;
      longestStreak;
      rankLabel;
    };
  };

  //
  // ────────────────────────────────────────────────────────────────────────────────────────────── Admin ─────

  /// adminListUsers: only admins can list all users.
  public query ({ caller }) func adminListUsers() : async [Principal] {
    if (not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list users");
    };
    userProfiles.keys().toArray();
  };
};
