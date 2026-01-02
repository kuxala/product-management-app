# Testing Guide

This document provides manual testing checklists to verify all features and permissions work correctly.

## Manual Test Checklist

### Authentication Tests

- [ ] Register new user (alice@test.com)
- [ ] Login works with correct credentials
- [ ] Logout clears session
- [ ] Protected routes redirect to login when not authenticated
- [ ] Invalid credentials show error message
- [ ] Refresh token works (wait 16 minutes and verify auto-refresh)
- [ ] Access token expires after 15 minutes

### Project Management Tests

- [ ] Create project
- [ ] View project list showing all owned and member projects
- [ ] Owner sees Edit/Delete buttons
- [ ] Member does NOT see Edit/Delete buttons
- [ ] Add member by email (owner only)
- [ ] Remove member (owner only)
- [ ] Delete project removes all tasks and members (owner only)
- [ ] Project list updates in real-time after creation

### Task Management Tests

- [ ] Create task in project
- [ ] Filter tasks by status (TODO, IN_PROGRESS, DONE)
- [ ] Filter tasks by priority (LOW, MEDIUM, HIGH)
- [ ] Filter tasks by assignee
- [ ] Update task status
- [ ] Update task priority
- [ ] Assign task to project member
- [ ] Delete task (owner only)
- [ ] Member can create tasks but NOT delete them
- [ ] Task list updates after creation/deletion

### Permissions Test Scenario

Follow these steps to verify role-based permissions:

1. **Setup Users**
   - Create user Alice (alice@test.com) - will be project owner
   - Create user Bob (bob@test.com) - will be project member
   - Create user Charlie (charlie@test.com) - will be non-member

2. **Create Project as Alice**
   - Login as Alice
   - Create project "Test Project"
   - Verify Alice is the owner

3. **Add Bob as Member**
   - As Alice, add Bob to project using bob@test.com
   - Verify Bob appears in members list with MEMBER role

4. **Test Bob's Permissions**
   - Login as Bob
   - Verify Bob can:
     - View the project
     - See project members
     - Create tasks
     - Update tasks
   - Verify Bob CANNOT:
     - Edit project details
     - Delete the project
     - Delete tasks
     - Add/remove members

5. **Test Charlie's Access**
   - Login as Charlie
   - Try to access the project URL directly
   - Verify Charlie gets 403 Forbidden or cannot see the project

6. **Test Owner Permissions**
   - Login back as Alice
   - Verify Alice can:
     - Edit project details
     - Delete tasks
     - Remove Bob from project
     - Delete the entire project

### Edge Cases

- [ ] Cannot add same user twice to project
- [ ] Cannot remove project owner from members
- [ ] Project owner cannot be changed
- [ ] Deleted project removes all associated tasks
- [ ] Deleted project removes all member associations
- [ ] User without projects sees empty state
- [ ] Project without tasks shows empty state

### UI/UX Tests

- [ ] Loading states show during API calls
- [ ] Error messages display correctly
- [ ] Success feedback after actions
- [ ] Forms reset after submission
- [ ] Responsive layout on mobile
- [ ] Navigation works correctly
- [ ] Logout redirects to login page

## Automated Testing (Future)

### Unit Tests
- Auth service (register, login, token generation)
- Projects service (CRUD operations)
- Tasks service (CRUD operations)
- Guards (ProjectMemberGuard, ProjectOwnerGuard)

### Integration Tests
- API endpoints with authentication
- Database operations with Prisma
- Permission checks across different roles

### E2E Tests
- Complete user flows (register → create project → add tasks)
- Multi-user scenarios
- Permission verification flows

## Test Data

### Sample Users
```
Alice (Owner)
- Email: alice@test.com
- Password: password123
- Role: Creates and owns projects

Bob (Member)
- Email: bob@test.com
- Password: password123
- Role: Project member

Charlie (Non-member)
- Email: charlie@test.com
- Password: password123
- Role: No access to Alice's projects
```

### Sample Projects
```
Project 1: "Website Redesign"
- Owner: Alice
- Members: Bob
- Tasks: 5 tasks with various statuses

Project 2: "Mobile App"
- Owner: Alice
- Members: None
- Tasks: 3 tasks
```

## Testing Commands

```bash
# Start all services
yarn dev

# Check API health
curl http://localhost:3000/api/auth/me

# View database
yarn db:studio

# Check TypeScript
cd apps/web && yarn tsc --noEmit
cd apps/api && yarn build --noEmit
```

## Known Issues / Expected Behavior

1. **Token Refresh**: Access token expires after 15 minutes. The frontend automatically refreshes using the refresh token.
2. **Concurrent Edits**: No conflict resolution for simultaneous edits.
3. **Real-time Updates**: Changes don't appear in real-time (requires page refresh).
4. **File Uploads**: Not implemented in this version.
5. **Email Notifications**: Not implemented in this version.

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/environment details
5. Console errors (if any)
