/**
 * OBEDIO iOS App - Data Models
 */

import Foundation

// MARK: - Service Request

struct ServiceRequest: Identifiable, Codable {
    let id: String
    let guestName: String
    let location: String
    let locationId: String
    let priority: ServiceRequestPriority
    let status: ServiceRequestStatus
    let timestamp: Date
    let voiceTranscript: String?
    let assignedTo: String?

    var formattedTime: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: timestamp, relativeTo: Date())
    }
}

enum ServiceRequestPriority: String, Codable {
    case normal = "normal"
    case high = "high"
    case emergency = "emergency"

    var color: Color {
        switch self {
        case .normal: return .blue
        case .high: return .orange
        case .emergency: return .red
        }
    }
}

enum ServiceRequestStatus: String, Codable {
    case pending = "pending"
    case accepted = "accepted"
    case completed = "completed"
}

// MARK: - Guest

struct Guest: Identifiable, Codable {
    let id: String
    let firstName: String
    let lastName: String
    let location: String
    let locationId: String
    let status: String
    let allergies: [String]
    let dietaryRestrictions: [String]
    let doNotDisturb: Bool

    var fullName: String {
        "\(firstName) \(lastName)"
    }
}

// MARK: - Crew Member

struct CrewMember: Identifiable, Codable {
    let id: String
    let name: String
    let position: String
    let department: String
    let status: CrewStatus
    let shift: String
}

enum CrewStatus: String, Codable {
    case onDuty = "on-duty"
    case offDuty = "off-duty"
    case onLeave = "on-leave"
}

// MARK: - User

struct User: Codable {
    let id: String
    let username: String
    let name: String
    let role: String
    let email: String
}

// MARK: - API Response

struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let error: String?
}
