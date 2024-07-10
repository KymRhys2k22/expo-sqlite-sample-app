import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
} from "react-native";
import * as SQLite from "expo-sqlite/legacy";
import {
  IconButton,
  Provider,
  Portal,
  Dialog,
  Button,
} from "react-native-paper";
import asyncAlert from "./asyncAlert";

const db = SQLite.openDatabase("little_lemon");

// Implement edit and delete with SQLite
// I-implement ang pag-edit at pag-delete gamit ang SQLite
export default function App() {
  const [textInputValue, setTextInputValue] = useState("");
  const [dialog, setDialog] = useState({
    customer: {},
    isVisible: false,
  });
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    db.transaction((tx) => {
      // Create table if it does not exist
      // Gumawa ng table kung wala pa
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY NOT NULL, uid TEXT, name TEXT);"
      );
      // Select all customers from the table
      // I-select ang lahat ng customers mula sa table
      tx.executeSql("SELECT * FROM customers", [], (_, { rows }) => {
        const customers = rows._array.map((item) => ({
          uid: item.uid,
          name: item.name,
        }));
        setCustomers(customers);
      });
    });
  }, []);

  // Function to show the dialog
  // Function para ipakita ang dialog
  const showDialog = (customer) =>
    setDialog({
      isVisible: true,
      customer,
    });

  // Function to hide the dialog and update the customer
  // Function para itago ang dialog at i-update ang customer
  const hideDialog = (updatedCustomer) => {
    setDialog({
      isVisible: false,
      customer: {},
    });

    // Update the local state
    // I-update ang local state
    const newCustomers = customers.map((customer) => {
      if (customer.uid !== updatedCustomer.uid) {
        return customer;
      }

      return updatedCustomer;
    });

    setCustomers(newCustomers);

    // Edit customer in the database
    // I-edit ang customer sa database
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE customers SET uid=?, name=? WHERE uid=${updatedCustomer.uid}`,
        [updatedCustomer.uid, updatedCustomer.name]
      );
    });
  };

  // Function to delete a customer
  // Function para mag-delete ng customer
  const deleteCustomer = async (customer) => {
    // Show confirmation alert
    // Magpakita ng confirmation alert
    const shouldDelete = await asyncAlert({
      title: "Delete customer",
      message: `Are you sure you want to delete the customer named "${customer.name}"?`,
    });
    if (!shouldDelete) {
      return;
    }

    // Update the local state
    // I-update ang local state
    const newCustomers = customers.filter((c) => c.uid !== customer.uid);
    setCustomers(newCustomers);

    // Delete customer from the database
    // I-delete ang customer mula sa database
    db.transaction((tx) => {
      tx.executeSql("DELETE FROM customers WHERE uid = ?", [customer.uid]);
    });
  };

  return (
    <Provider>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.titleText}>Little Lemon Customers</Text>
          <TextInput
            placeholder="Enter the customer name"
            value={textInputValue}
            onChangeText={(data) => setTextInputValue(data)}
            underlineColorAndroid="transparent"
            style={styles.textInputStyle}
          />
          <TouchableOpacity
            disabled={!textInputValue}
            onPress={() => {
              const newValue = {
                uid: Date.now().toString(),
                name: textInputValue,
              };
              setCustomers([...customers, newValue]);

              // Insert new customer into the database
              // I-insert ang bagong customer sa database
              db.transaction((tx) => {
                tx.executeSql(
                  "insert into customers (uid, name) values(?, ?)",
                  [newValue.uid, newValue.name]
                );
              });
              setTextInputValue("");
            }}
            style={styles.buttonStyle}>
            <Text style={styles.buttonTextStyle}> Save Customer </Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.customerName}>Customers: </Text>
            {customers.map((customer, index) => (
              <View key={index} style={styles.customer}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <View style={styles.icons}>
                  <IconButton
                    icon="pen"
                    size={24}
                    onPress={() => showDialog(customer)}
                  />
                  <IconButton
                    icon="delete"
                    size={24}
                    onPress={() => deleteCustomer(customer)}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
        <Portal>
          <Dialog
            visible={dialog.isVisible}
            onDismiss={() => hideDialog(dialog.customer)}>
            <Dialog.Title>Edit Customer name</Dialog.Title>
            <Dialog.Content>
              <TextInput
                value={dialog.customer.name}
                onChangeText={(text) =>
                  setDialog((prev) => ({
                    ...prev,
                    customer: {
                      ...prev.customer,
                      name: text,
                    },
                  }))
                }
                underlineColorAndroid="transparent"
                style={styles.textInputStyle}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => hideDialog(dialog.customer)}>Done</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "white",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 20,
  },
  customer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customerName: {
    fontSize: 18,
  },
  buttonStyle: {
    fontSize: 16,
    color: "white",
    backgroundColor: "green",
    padding: 5,
    marginTop: 32,
    minWidth: 250,
    marginBottom: 16,
  },
  buttonTextStyle: {
    padding: 5,
    fontSize: 18,
    color: "white",
    textAlign: "center",
  },
  textInputStyle: {
    textAlign: "center",
    height: 40,
    fontSize: 18,
    width: "100%",
    borderWidth: 1,
    borderColor: "green",
  },
  icons: {
    flexDirection: "row",
  },
});
