import { auth, db, googleProvider } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const authSection = document.getElementById("auth-section");
const blogSection = document.getElementById("blog-section");
const signupFormContainer = document.getElementById("signup-form-container");
const loginFormContainer = document.getElementById("login-form-container");
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const userDisplayName = document.getElementById("user-display-name");

const postsContainer = document.getElementById("posts-container");
const postModal = document.getElementById("post-modal");
const postForm = document.getElementById("post-form");
const openModalBtn = document.getElementById("open-post-modal-btn");
const closeModalBtn = document.getElementById("close-modal");
const searchInput = document.getElementById("search-input");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const postDescription = document.getElementById("post-description");
const charCounter = document.getElementById("char-counter");

const profileBtn = document.getElementById("profile-btn");
const profileModal = document.getElementById("profile-modal");
const closeProfileModal = document.getElementById("close-profile-modal");
const editProfileForm = document.getElementById("edit-profile-form");

let allPosts = [];


signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const username = document.getElementById("signup-username").value.trim();
    const fatherName = document.getElementById("signup-father-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const phone = document.getElementById("signup-phone").value.trim();
    const country = document.getElementById("signup-country").value.trim();
    const city = document.getElementById("signup-city").value.trim();
    const age = document.getElementById("signup-age").value.trim();
    const password = document.getElementById("signup-password").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });

        await setDoc(doc(db, "users", userCredential.user.uid), {
            name,
            username,
            fatherName,
            email,
            phone,
            password,
            country,
            city,
            age: Number(age),
            createdAt: serverTimestamp()
        });

        Swal.fire("Success!", "Account created successfully!", "success");
        signupForm.reset();
    } catch (error) {
        Swal.fire("Error!", error.message, "error");
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        Swal.fire("Welcome!", "Login successful!", "success");
        loginForm.reset();
    } catch (error) {
        Swal.fire("Error!", error.message, "error");
    }
});

async function handleGoogleAuth() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        await setDoc(doc(db, "users", user.uid), {
            name: user.displayName || "Google User",
            username: user.email.split("@")[0],
            email: user.email,
            createdAt: serverTimestamp()
        }, { merge: true });

        Swal.fire("Success!", "Signed in with Google!", "success");
    } catch (error) {
        Swal.fire("Google Auth Error!", error.message, "error");
    }
}

document.getElementById("google-signup-btn").addEventListener("click", handleGoogleAuth);
document.getElementById("google-login-btn").addEventListener("click", handleGoogleAuth);

logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => Swal.fire("Logged Out", "Logged out successfully.", "info"));
});

document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    signupFormContainer.classList.add("hidden");
    loginFormContainer.classList.remove("hidden");
});

document.getElementById("show-signup").addEventListener("click", (e) => {
    e.preventDefault();
    loginFormContainer.classList.add("hidden");
    signupFormContainer.classList.remove("hidden");
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.classList.add("hidden");
        blogSection.classList.remove("hidden");
        logoutBtn.classList.remove("hidden");
        profileBtn.classList.remove("hidden");
        userDisplayName.classList.remove("hidden");
        userDisplayName.textContent = `👤 ${user.displayName || "User"}`;
        loadPosts();
    } else {
        authSection.classList.remove("hidden");
        blogSection.classList.add("hidden");
        logoutBtn.classList.add("hidden");
        profileBtn.classList.add("hidden");
        userDisplayName.classList.add("hidden");
    }
});


async function loadPosts() {
    postsContainer.innerHTML = "<p>Loading posts...</p>";
    try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        allPosts = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        renderPosts(allPosts);
    } catch (error) {
        try {
            const snapshot = await getDocs(collection(db, "posts"));
            allPosts = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            renderPosts(allPosts);
        } catch (err) {
            Swal.fire("Error!", "Failed to fetch posts: " + err.message, "error");
        }
    }
}

function renderPosts(posts) {
    postsContainer.innerHTML = "";
    if (posts.length === 0) {
        postsContainer.innerHTML = "<p>No posts available.</p>";
        return;
    }

    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;

    posts.forEach((post) => {
        const dateStr = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : "Just now";
        const postElement = document.createElement("article");
        postElement.className = "card post-card";
        const isOwner = currentUserId && currentUserId === post.authorId;

        const likesArray = post.likes || [];
        const isLiked = currentUserId && likesArray.includes(currentUserId);
        const likeCount = likesArray.length;

        postElement.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <div class="post-meta"><i class="fa-solid fa-user"></i> <strong>${escapeHtml(post.author)}</strong> • <i class="fa-regular fa-clock"></i> ${dateStr}</div>
      <p>${escapeHtml(post.description)}</p>
      
      <div class="post-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center;">
        <button class="btn-like ${isLiked ? "liked" : ""}" data-id="${post.id}">
          <i class="${isLiked ? "fa-solid" : "fa-regular"} fa-heart"></i> 
          <span>${likeCount}</span> ${likeCount === 1 ? "Like" : "Likes"}
        </button>

        ${isOwner ? `
          <button class="btn-edit" data-id="${post.id}"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-delete" data-id="${post.id}"><i class="fa-solid fa-trash"></i> Delete</button>
        ` : ""}
      </div>
    `;
        postsContainer.appendChild(postElement);
    });

    document.querySelectorAll(".btn-like").forEach((btn) => btn.addEventListener("click", handleLikeToggle));
    document.querySelectorAll(".btn-edit").forEach((btn) => btn.addEventListener("click", handleEdit));
    document.querySelectorAll(".btn-delete").forEach((btn) => btn.addEventListener("click", handleDelete));
}

async function handleLikeToggle(e) {
    const user = auth.currentUser;
    if (!user) {
        Swal.fire("Error!", "Please login to like posts.", "error");
        return;
    }

    const btn = e.target.closest("button");
    const postId = btn.dataset.id;
    const post = allPosts.find((p) => p.id === postId);

    if (!post) return;

    const likesArray = post.likes || [];
    const userIndex = likesArray.indexOf(user.uid);

    if (userIndex === -1) {
        likesArray.push(user.uid);
    } else {
        likesArray.splice(userIndex, 1);
    }

    try {
        await updateDoc(doc(db, "posts", postId), {
            likes: likesArray
        });

        post.likes = likesArray;
        renderPosts(allPosts);
    } catch (error) {
        Swal.fire("Error!", "Could not update like: " + error.message, "error");
    }
}

postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("post-id").value;
    const title = document.getElementById("post-title").value.trim();
    const description = postDescription.value.trim();

    try {
        if (id) {
            await updateDoc(doc(db, "posts", id), { title, description, updatedAt: serverTimestamp() });
            Swal.fire("Updated!", "Your post was updated.", "success");
        } else {
            await addDoc(collection(db, "posts"), {
                title,
                description,
                author: auth.currentUser.displayName || "Anonymous",
                authorId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });
            Swal.fire("Published!", "Post published successfully.", "success");
        }
        postModal.classList.add("hidden");
        postForm.reset();
        charCounter.textContent = "0 / 1500 characters";
        loadPosts();
    } catch (error) {
        Swal.fire("Error!", "Could not save post: " + error.message, "error");
    }
});

function handleEdit(e) {
    const id = e.target.closest("button").dataset.id;
    const post = allPosts.find((p) => p.id === id);
    if (post) {
        document.getElementById("post-id").value = post.id;
        document.getElementById("post-title").value = post.title;
        postDescription.value = post.description;
        charCounter.textContent = `${post.description.length} / 1500 characters`;
        document.getElementById("modal-title").textContent = "Edit Post";
        postModal.classList.remove("hidden");
    }
}

async function handleDelete(e) {
    const id = e.target.closest("button").dataset.id;
    const result = await Swal.fire({
        title: "Are you sure?",
        text: "Deleting this post is permanent!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, "posts", id));
            Swal.fire("Deleted!", "Post deleted successfully.", "success");
            loadPosts();
        } catch (error) {
            Swal.fire("Error!", error.message, "error");
        }
    }
}


searchInput.addEventListener("input", (e) => {
    const queryText = e.target.value.toLowerCase();
    const filtered = allPosts.filter(
        (post) =>
            post.title.toLowerCase().includes(queryText) ||
            post.description.toLowerCase().includes(queryText)
    );
    renderPosts(filtered);
});

profileBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        document.getElementById("profile-name").textContent = userData.name || user.displayName || "N/A";
        document.getElementById("profile-username").textContent = user.displayName || "N/A";
        document.getElementById("profile-email").textContent = user.email;
        document.getElementById("profile-phone").textContent = userData.phone || "N/A";
        document.getElementById("profile-location").textContent = userData.city ? `${userData.city}, ${userData.country}` : "N/A";

        const userPosts = allPosts.filter(p => p.authorId === user.uid);
        document.getElementById("profile-post-count").textContent = userPosts.length;

        profileModal.classList.remove("hidden");
    } catch (err) {
        Swal.fire("Error!", "Could not load profile: " + err.message, "error");
    }
});

closeProfileModal.addEventListener("click", () => profileModal.classList.add("hidden"));

editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = document.getElementById("edit-username").value.trim();
    if (!newName) return;

    try {
        await updateProfile(auth.currentUser, { displayName: newName });
        userDisplayName.textContent = `👤 ${newName}`;
        Swal.fire("Updated!", "Username updated successfully.", "success");
        profileModal.classList.add("hidden");
        editProfileForm.reset();
        loadPosts();
    } catch (err) {
        Swal.fire("Error!", err.message, "error");
    }
});

themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i> Light Mode' : '<i class="fa-solid fa-moon"></i> Dark Mode';
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
}

postDescription.addEventListener("input", () => {
    charCounter.textContent = `${postDescription.value.length} / 1500 characters`;
});

openModalBtn.addEventListener("click", () => {
    postForm.reset();
    document.getElementById("post-id").value = "";
    document.getElementById("modal-title").textContent = "Create Post";
    charCounter.textContent = "0 / 1500 characters";
    postModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => postModal.classList.add("hidden"));

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}