import { QRCodeSVG } from "qrcode.react";
import { formatDate, formatFCFA } from "@/lib/fcfa";
import { Bus } from "lucide-react";

interface TicketData {
  id: number;
  ticketCode: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string | null;
  passengerIdNumber?: string | null;
  seatNumber?: string | null;
  price: number;
  status: string;
  originCity?: string | null;
  destinationCity?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
  createdAt?: string;
  vehicleLicensePlate?: string;
  companyName?: string;
}

interface TicketPrintProps {
  reservation: TicketData;
  bagageCount?: number;
}

export function TicketPrint({ reservation, bagageCount = 0 }: TicketPrintProps) {
  const qrData = JSON.stringify({
    code: reservation.ticketCode,
    id: reservation.id,
    passenger: reservation.passengerName,
    seat: reservation.seatNumber,
    route: `${reservation.originCity ?? ""}→${reservation.destinationCity ?? ""}`,
    date: reservation.departureDate,
  });

  return (
    <div className="ticket-print bg-white text-black font-sans" style={{ width: "80mm", fontFamily: "Arial, sans-serif" }}>
      {/* En-tête */}
      <div style={{ background: "#1e40af", color: "white", padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "24px", height: "24px", background: "rgba(255,255,255,0.2)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "14px" }}>🚌</span>
        </div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "13px" }}>{reservation.companyName ?? "MuraTravel"}</div>
          <div style={{ fontSize: "10px", opacity: 0.8 }}>Billet de Voyage</div>
        </div>
      </div>

      {/* Corps du billet */}
      <div style={{ padding: "10px 12px", borderBottom: "1px dashed #ccc" }}>
        {/* Itinéraire */}
        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "0.5px" }}>
            {reservation.originCity ?? "—"} → {reservation.destinationCity ?? "—"}
          </div>
          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
            {formatDate(reservation.departureDate)}
            {reservation.departureTime ? ` · ${reservation.departureTime}` : ""}
          </div>
        </div>

        {/* Info passager */}
        <div style={{ background: "#f8f9fa", borderRadius: "6px", padding: "8px 10px", marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Passager</div>
              <div style={{ fontWeight: "bold", fontSize: "13px", marginTop: "1px" }}>{reservation.passengerName}</div>
              <div style={{ fontSize: "10px", color: "#555" }}>{reservation.passengerPhone}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Siège</div>
              <div style={{ fontWeight: "bold", fontSize: "22px", color: "#1e40af", lineHeight: 1 }}>{reservation.seatNumber ?? "—"}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
          <div>
            <span style={{ color: "#888" }}>Véhicule: </span>
            <span style={{ fontWeight: "600" }}>{reservation.vehicleLicensePlate ?? "—"}</span>
          </div>
          <div>
            <span style={{ color: "#888" }}>Bagages: </span>
            <span style={{ fontWeight: "600" }}>{bagageCount}</span>
          </div>
        </div>
      </div>

      {/* QR Code + code billet */}
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px dashed #ccc" }}>
        <QRCodeSVG
          value={qrData}
          size={80}
          level="M"
          includeMargin={false}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", marginBottom: "2px" }}>Code Billet</div>
          <div style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "14px", letterSpacing: "1px", color: "#1e40af" }}>
            {reservation.ticketCode}
          </div>
          <div style={{ marginTop: "6px" }}>
            <div style={{ fontSize: "9px", color: "#888" }}>Tarif total</div>
            <div style={{ fontWeight: "bold", fontSize: "15px" }}>{formatFCFA(reservation.price)}</div>
          </div>
        </div>
      </div>

      {/* Coupon de contrôle (partie détachable) */}
      <div style={{ padding: "8px 12px", background: "#f8f9fa" }}>
        <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Coupon de contrôle</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
          <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{reservation.ticketCode}</span>
          <span>{reservation.passengerName.split(" ")[0]}</span>
          <span style={{ fontWeight: "600" }}>{reservation.seatNumber ?? "—"}</span>
        </div>
      </div>

      {/* Pied de page */}
      <div style={{ padding: "6px 12px", textAlign: "center", fontSize: "9px", color: "#aaa" }}>
        Scannable à l'embarquement · MuraTravel © 2024
      </div>
    </div>
  );
}
