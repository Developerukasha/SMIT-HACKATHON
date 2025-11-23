/* ===================================
   AUTHENTICATION MODULE
   Handles user signup, login, logout, and session management
   =================================== */

// Initialize users array in localStorage if it doesn't exist
function initializeStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Signup function
function signup(name, email, password) {
    initializeStorage();

    // Validation
    if (!name || !email || !password) {
        return {
            success: false,
            message: 'All fields are required'
        };
    }

    if (password.length < 6) {
        return {
            success: false,
            message: 'Password must be at least 6 characters long'
        };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: 'Please enter a valid email address'
        };
    }

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users'));
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
        return {
            success: false,
            message: 'An account with this email already exists'
        };
    }

    // Create new user
    const newUser = {
        id: generateId(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password // Note: In production, this should be hashed
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    return {
        success: true,
        message: 'Account created successfully! Redirecting to login...'
    };
}

// Login function
function login(email, password) {
    initializeStorage();

    // Validation
    if (!email || !password) {
        return {
            success: false,
            message: 'Email and password are required'
        };
    }

    // Find user
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u =>
        u.email.toLowerCase() === email.toLowerCase().trim() &&
        u.password === password
    );

    if (!user) {
        return {
            success: false,
            message: 'Incorrect email or password'
        };
    }

    // Save current user session (without password)
    const userSession = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    localStorage.setItem('currentUser', JSON.stringify(userSession));

    return {
        success: true,
        message: 'Login successful!',
        user: userSession
    };
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
}

// Get current logged-in user
function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

// Check if user is authenticated
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Expose functions to global scope
window.signup = signup;
window.login = login;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
