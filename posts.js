/* ===================================
   POSTS MODULE
   Handles post creation, deletion, editing, liking, and rendering
   =================================== */

// Initialize posts array in localStorage if it doesn't exist
function initializePosts() {
    if (!localStorage.getItem('posts')) {
        localStorage.setItem('posts', JSON.stringify([]));
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

// Sanitize HTML to prevent XSS
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Handle file selection and preview
function handleFileSelect(input, previewContainer, previewImage) {
    const file = input.files[0];
    if (file) {
        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            showPopup('Please select a valid image (JPG, PNG)', 'error');
            input.value = '';
            return;
        }

        // Read file
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }
}

// Initialize feed
function initializeFeed() {
    initializePosts();
    renderFeed();

    // Setup create post form
    const createPostForm = document.getElementById('createPostForm');
    const fileInput = document.getElementById('postFile');
    const fileBtn = document.getElementById('fileBtn');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');

    // File input trigger
    if (fileBtn && fileInput) {
        fileBtn.addEventListener('click', () => fileInput.click());

        // File selection handler
        fileInput.addEventListener('change', () => {
            handleFileSelect(fileInput, imagePreview, previewImg);
        });
    }

    // Remove image handler
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            fileInput.value = '';
            imagePreview.style.display = 'none';
            previewImg.src = '';
        });
    }

    if (createPostForm) {
        createPostForm.addEventListener('submit', handleCreatePost);
    }

    // Setup search and sort
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
        btn.addEventListener('click', (e) => handleSort(e.target));
    });
}

// Handle create post
function handleCreatePost(e) {
    e.preventDefault();

    const text = document.getElementById('postText').value;
    const imageUrl = document.getElementById('postImage').value;
    const fileInput = document.getElementById('postFile');
    const currentUser = getCurrentUser();

    if (!currentUser) {
        showPopup('Please login to create a post', 'error');
        return;
    }

    if (!text.trim() && !imageUrl.trim() && !fileInput.files[0]) {
        showPopup('Post cannot be empty', 'error');
        return;
    }

    // Determine image source (file upload takes precedence)
    let finalImage = imageUrl;

    const processPost = (imgSrc) => {
        const newPost = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            text: text.trim(),
            imageUrl: imgSrc.trim(),
            timestamp: Date.now(),
            likes: [] // Array of user IDs who liked the post
        };

        const posts = JSON.parse(localStorage.getItem('posts'));
        posts.unshift(newPost); // Add to beginning
        localStorage.setItem('posts', JSON.stringify(posts));

        // Reset form
        document.getElementById('createPostForm').reset();
        document.getElementById('imagePreview').style.display = 'none';

        renderFeed();
        showPopup('Post created successfully!', 'success');
    };

    if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            processPost(e.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        processPost(finalImage);
    }
}

// Render feed
function renderFeed(postsToRender = null) {
    const feedContainer = document.getElementById('feedContainer');
    const emptyState = document.getElementById('emptyState');

    if (!feedContainer) return;

    const posts = postsToRender || getPosts();

    feedContainer.innerHTML = '';

    if (posts.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        posts.forEach(post => {
            const postCard = renderPostCard(post);
            feedContainer.appendChild(postCard);
        });
    }
}

// Get posts with sorting and filtering
let currentSort = 'latest';
let currentSearch = '';

function getPosts() {
    let posts = JSON.parse(localStorage.getItem('posts')) || [];

    // Filter by search
    if (currentSearch) {
        const term = currentSearch.toLowerCase();
        posts = posts.filter(post =>
            post.text.toLowerCase().includes(term) ||
            post.userName.toLowerCase().includes(term)
        );
    }

    // Sort
    switch (currentSort) {
        case 'latest':
            posts.sort((a, b) => b.timestamp - a.timestamp);
            break;
        case 'oldest':
            posts.sort((a, b) => a.timestamp - b.timestamp);
            break;
        case 'liked':
            posts.sort((a, b) => b.likes.length - a.likes.length);
            break;
    }

    return posts;
}

// Render single post card
function renderPostCard(post) {
    const currentUser = getCurrentUser();
    const isOwner = currentUser && post.userId === currentUser.id;
    const isLiked = isLikedByCurrentUser(post);

    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.postId = post.id;

    // Format timestamp with edited indicator
    let timestampText = formatTimestamp(post.timestamp);
    if (post.editedAt) {
        timestampText += ' (Edited)';
    }

    postCard.innerHTML = `
        <div class="post-header">
            <div class="post-user-info">
                <div class="post-username">${sanitizeHTML(post.userName)}</div>
                <div class="post-timestamp">${timestampText}</div>
            </div>
            ${isOwner ? `
                <div class="post-actions">
                    <button class="post-edit-btn" onclick="handleEditPost('${post.id}')">
                        <span class="edit-icon">✏️</span> Edit
                    </button>
                    <button class="post-delete-btn" onclick="handleDeletePost('${post.id}')">Delete</button>
                </div>
            ` : ''}
        </div>
        
        <div class="post-text">${sanitizeHTML(post.text)}</div>
        
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" class="post-image" onerror="this.style.display='none'">` : ''}
        
        <div class="post-footer">
            <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="handleToggleLike('${post.id}')">
                <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
                <span class="like-count">${post.likes.length}</span>
                <span>${post.likes.length === 1 ? 'Like' : 'Likes'}</span>
            </button>
        </div>
    `;

    return postCard;
}

// Handle delete post
function handleDeletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        let posts = JSON.parse(localStorage.getItem('posts'));
        posts = posts.filter(post => post.id !== postId);
        localStorage.setItem('posts', JSON.stringify(posts));
        renderFeed();
        showPopup('Post deleted successfully', 'error');
    }
}

// Handle edit post
function handleEditPost(postId) {
    const posts = JSON.parse(localStorage.getItem('posts'));
    const post = posts.find(p => p.id === postId);

    if (!post) return;

    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.id = 'editModal';

    modal.innerHTML = `
        <div class="edit-modal-content">
            <div class="edit-modal-header">
                <h3>Edit Post</h3>
                <button class="edit-modal-close" onclick="closeEditModal()">&times;</button>
            </div>
            <div class="edit-modal-body">
                <div class="form-group">
                    <textarea id="editText" rows="4" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">${post.text}</textarea>
                </div>
                <div class="form-group">
                    <div class="media-input-container">
                        <input type="url" id="editImage" value="${post.imageUrl}" placeholder="Image URL" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                        <div class="file-input-wrapper">
                            <input type="file" id="editFile" accept="image/jpeg, image/png, image/jpg" hidden>
                            <button type="button" id="editFileBtn" class="btn-icon" title="Upload Image">📷</button>
                        </div>
                    </div>
                    <div id="editImagePreview" class="image-preview" style="display: ${post.imageUrl ? 'flex' : 'none'}; margin-top: 10px;">
                        <img id="editPreviewImg" src="${post.imageUrl}" alt="Preview">
                        <button type="button" id="removeEditImageBtn" class="btn-remove-image">&times;</button>
                    </div>
                </div>
            </div>
            <div class="edit-modal-footer">
                <button class="btn-secondary" onclick="closeEditModal()">Cancel</button>
                <button class="btn-primary" onclick="saveEditedPost('${post.id}')">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Setup edit modal file handlers
    const editFileBtn = document.getElementById('editFileBtn');
    const editFileInput = document.getElementById('editFile');
    const editPreview = document.getElementById('editImagePreview');
    const editPreviewImg = document.getElementById('editPreviewImg');
    const removeEditImgBtn = document.getElementById('removeEditImageBtn');
    const editUrlInput = document.getElementById('editImage');

    editFileBtn.addEventListener('click', () => editFileInput.click());

    editFileInput.addEventListener('change', () => {
        handleFileSelect(editFileInput, editPreview, editPreviewImg);
        editUrlInput.value = ''; // Clear URL if file selected
    });

    removeEditImgBtn.addEventListener('click', () => {
        editFileInput.value = '';
        editUrlInput.value = '';
        editPreview.style.display = 'none';
        editPreviewImg.src = '';
    });

    // Close on outside click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeEditModal();
        }
    });
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
}

function saveEditedPost(postId) {
    const newText = document.getElementById('editText').value;
    const newImageUrl = document.getElementById('editImage').value;
    const fileInput = document.getElementById('editFile');

    let posts = JSON.parse(localStorage.getItem('posts'));
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) return;

    const updatePost = (imgSrc) => {
        posts[postIndex].text = newText.trim();
        posts[postIndex].imageUrl = imgSrc.trim();
        posts[postIndex].editedAt = Date.now();

        localStorage.setItem('posts', JSON.stringify(posts));
        renderFeed();
        closeEditModal();
        showPopup('Post updated successfully!', 'edit');
    };

    if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            updatePost(e.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        updatePost(newImageUrl);
    }
}

// Handle like toggle
function handleToggleLike(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showPopup('Please login to like posts', 'error');
        return;
    }

    let posts = JSON.parse(localStorage.getItem('posts'));
    const post = posts.find(p => p.id === postId);

    if (post) {
        const likeIndex = post.likes.indexOf(currentUser.id);
        if (likeIndex === -1) {
            post.likes.push(currentUser.id);
        } else {
            post.likes.splice(likeIndex, 1);
        }

        localStorage.setItem('posts', JSON.stringify(posts));
        renderFeed();
    }
}

// Check if post is liked by current user
function isLikedByCurrentUser(post) {
    const currentUser = getCurrentUser();
    return currentUser && post.likes.includes(currentUser.id);
}

// Handle search
function handleSearch(e) {
    currentSearch = e.target.value;
    renderFeed();
}

// Handle sort
function handleSort(btn) {
    // Update active button
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentSort = btn.dataset.sort;
    renderFeed();
}

// Expose functions to global scope for onclick handlers
window.handleDeletePost = handleDeletePost;
window.handleEditPost = handleEditPost;
window.handleToggleLike = handleToggleLike;
window.saveEditedPost = saveEditedPost;
window.closeEditModal = closeEditModal;
