import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  type OldActor = {
    userDataStore : Map.Map<Text, Map.Map<Text, Text>>;
    // Other old state fields...
  };

  type NewActor = {
    userDataStore : Map.Map<Text, Map.Map<Text, Text>>;
    principalDataStore : Map.Map<Principal, Map.Map<Text, Text>>;
    // Other new state fields...
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      principalDataStore = Map.empty<Principal, Map.Map<Text, Text>>()
    };
  };
};
