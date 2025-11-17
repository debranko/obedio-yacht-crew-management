/**
 * OBEDIO iOS App
 * Main content view with service request monitoring
 */

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = OBEDIOViewModel()
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            // Service Requests Tab
            ServiceRequestsView()
                .tabItem {
                    Label("Requests", systemImage: "bell.fill")
                }
                .badge(viewModel.pendingRequestsCount)
                .tag(0)

            // Guests Tab
            GuestsView()
                .tabItem {
                    Label("Guests", systemImage: "person.2.fill")
                }
                .tag(1)

            // Duty Roster Tab
            DutyRosterView()
                .tabItem {
                    Label("Duty", systemImage: "calendar")
                }
                .tag(2)

            // Settings Tab
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(3)
        }
        .environmentObject(viewModel)
        .onAppear {
            viewModel.connect()
        }
    }
}

// MARK: - Service Requests View

struct ServiceRequestsView: View {
    @EnvironmentObject var viewModel: OBEDIOViewModel

    var body: some View {
        NavigationView {
            List {
                if viewModel.isLoading {
                    ProgressView("Loading...")
                } else if viewModel.serviceRequests.isEmpty {
                    Text("No active service requests")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(viewModel.serviceRequests) { request in
                        ServiceRequestCard(request: request)
                    }
                }
            }
            .navigationTitle("Service Requests")
            .refreshable {
                await viewModel.refreshServiceRequests()
            }
        }
    }
}

struct ServiceRequestCard: View {
    let request: ServiceRequest
    @EnvironmentObject var viewModel: OBEDIOViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading) {
                    Text(request.guestName)
                        .font(.headline)
                    Text(request.location)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                PriorityBadge(priority: request.priority)
            }

            Text(request.formattedTime)
                .font(.caption)
                .foregroundColor(.secondary)

            if request.status == .pending {
                Button("Accept") {
                    viewModel.acceptRequest(request.id)
                }
                .buttonStyle(.borderedProminent)
            } else if request.status == .accepted {
                Button("Complete") {
                    viewModel.completeRequest(request.id)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(.vertical, 4)
    }
}

struct PriorityBadge: View {
    let priority: ServiceRequestPriority

    var body: some View {
        Text(priority.rawValue.uppercased())
            .font(.caption.weight(.bold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(priority.color.opacity(0.2))
            .foregroundColor(priority.color)
            .cornerRadius(8)
    }
}

// MARK: - Guests View

struct GuestsView: View {
    @EnvironmentObject var viewModel: OBEDIOViewModel

    var body: some View {
        NavigationView {
            List(viewModel.guests) { guest in
                NavigationLink(destination: GuestDetailView(guest: guest)) {
                    GuestRow(guest: guest)
                }
            }
            .navigationTitle("Guests")
            .refreshable {
                await viewModel.refreshGuests()
            }
        }
    }
}

struct GuestRow: View {
    let guest: Guest

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(guest.fullName)
                    .font(.headline)
                Text(guest.location)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if guest.doNotDisturb {
                Image(systemName: "bell.slash.fill")
                    .foregroundColor(.orange)
            }
        }
    }
}

struct GuestDetailView: View {
    let guest: Guest

    var body: some View {
        List {
            Section("Information") {
                LabeledContent("Name", value: guest.fullName)
                LabeledContent("Location", value: guest.location)
                LabeledContent("Status", value: guest.status)
            }

            if !guest.allergies.isEmpty {
                Section("Allergies") {
                    ForEach(guest.allergies, id: \.self) { allergy in
                        Text(allergy)
                    }
                }
            }

            if !guest.dietaryRestrictions.isEmpty {
                Section("Dietary Restrictions") {
                    ForEach(guest.dietaryRestrictions, id: \.self) { restriction in
                        Text(restriction)
                    }
                }
            }
        }
        .navigationTitle(guest.fullName)
    }
}

// MARK: - Duty Roster View

struct DutyRosterView: View {
    @EnvironmentObject var viewModel: OBEDIOViewModel

    var body: some View {
        NavigationView {
            List {
                Section("On Duty Now") {
                    if viewModel.onDutyCrew.isEmpty {
                        Text("No crew on duty")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(viewModel.onDutyCrew) { crew in
                            CrewRow(crew: crew)
                        }
                    }
                }

                Section("Next Shift") {
                    if viewModel.nextShiftCrew.isEmpty {
                        Text("No upcoming shift")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(viewModel.nextShiftCrew) { crew in
                            CrewRow(crew: crew)
                        }
                    }
                }
            }
            .navigationTitle("Duty Roster")
            .refreshable {
                await viewModel.refreshDutyRoster()
            }
        }
    }
}

struct CrewRow: View {
    let crew: CrewMember

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(crew.name)
                    .font(.headline)
                Text(crew.position)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(crew.shift)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Settings View

struct SettingsView: View {
    @EnvironmentObject var viewModel: OBEDIOViewModel
    @AppStorage("serverURL") private var serverURL = "http://192.168.1.100:3001"
    @AppStorage("enableNotifications") private var enableNotifications = true

    var body: some View {
        NavigationView {
            Form {
                Section("Server") {
                    TextField("API URL", text: $serverURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    HStack {
                        Text("Connection")
                        Spacer()
                        Circle()
                            .fill(viewModel.isConnected ? Color.green : Color.red)
                            .frame(width: 12, height: 12)
                    }
                }

                Section("Notifications") {
                    Toggle("Enable Notifications", isOn: $enableNotifications)
                }

                Section("Account") {
                    HStack {
                        Text("User")
                        Spacer()
                        Text(viewModel.currentUser?.name ?? "Not logged in")
                            .foregroundColor(.secondary)
                    }

                    Button("Logout", role: .destructive) {
                        viewModel.logout()
                    }
                }

                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Build", value: "1")
                }
            }
            .navigationTitle("Settings")
        }
    }
}

// MARK: - Preview

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
