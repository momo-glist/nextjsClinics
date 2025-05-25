import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import { Facture, Patient, Agenda, DetailFacture, Clinique } from "@prisma/client";

// Styles
const styles = StyleSheet.create({
  page: {
    fontSize: 12,
    fontFamily: "Helvetica",
    padding: 30,
    backgroundColor: "#fff",
  },
  invoice: {
    width: "100%",
    padding: 10,
    border: "1 solid #ccc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1 solid #000",
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerRight: {
    textAlign: "right",
    justifyContent: "flex-end",
  },
  boldText: {
    fontWeight: "bold",
  },
  section: {
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  table: {
    marginTop: 20,
    border: "1 solid #000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #000",
  },
  tableCellHeader: {
    flex: 1,
    padding: 6,
    backgroundColor: "#f2f2f2",
    fontWeight: "bold",
    borderRight: "1 solid #000",
  },
  tableCell: {
    flex: 1,
    padding: 6,
    borderRight: "1 solid #000",
  },
  thankYou: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});

type Props = {
  facture: Facture & { details: DetailFacture[] };
  patient: Patient;
  agenda: Agenda;
  clinique: Clinique;
};

function InvoicePDF({ facture, patient, agenda, clinique}: Props) {
  // console.log({ facture, patient, agenda, clinique });
  // console.log("Details", JSON.stringify(facture.details, null, 2));
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.invoice}>
          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.headerRight}>
              <Text style={styles.boldText}>{clinique.nom}</Text>
              <Text>{clinique.adresse}</Text>
              <Text>{clinique.telephone}</Text>
            </View>
          </View>

          {/* Infos patient */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Text>Facture à : {patient.nom} {patient.prenom}</Text>
              <Text>Age : {patient.age} ans</Text>
              <Text>Résidence : {patient.adresse}</Text>
            </View>
            <View style={styles.row}>
              <Text>Prix : {facture.prix} FCFA</Text>
              <Text>Date : {new Date(agenda.date).toLocaleDateString()}</Text>
            </View>
          </View>

          {/* Détails des soins */}
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellHeader}>Soin ID</Text>
              <Text style={styles.tableCellHeader}>Prix (FCFA)</Text>
            </View>
            {facture.details.map((detail, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{detail.soinId}</Text>
                <Text style={styles.tableCell}>{detail.prix}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <Text style={styles.thankYou}>Ordonnance</Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDF;
