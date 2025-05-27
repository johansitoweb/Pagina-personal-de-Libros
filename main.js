 // Data persistence using localStorage
        const STORAGE_KEY = 'biblioteca-digital-books';
        
        // Sample initial books data
        const initialBooks = [
            {
                id: '1',
                title: 'El Principito',
                author: 'Antoine de Saint-Exupéry',
                description: 'Una historia filosófica para niños y adultos sobre la amistad y el sentido de la vida.',
                coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                fileUrl: 'https://www.africau.edu/images/default/sample.pdf', // PDF de ejemplo
                uploadedAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Cien años de soledad',
                author: 'Gabriel García Márquez',
                description: 'La obra maestra del realismo mágico que narra la historia de la familia Buendía en Macondo.',
                coverUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                fileUrl: 'https://www.africau.edu/images/default/sample.pdf', // PDF de ejemplo
                uploadedAt: new Date().toISOString()
            },
            {
                id: '3',
                title: '1984',
                author: 'George Orwell',
                description: 'Una distopía clásica sobre vigilancia gubernamental y control del pensamiento.',
                coverUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                fileUrl: 'https://www.africau.edu/images/default/sample.pdf', // PDF de ejemplo
                uploadedAt: new Date().toISOString()
            }
        ];

        // PDF Viewer variables
        let pdfDoc = null,
            pageNum = 1,
            pageRendering = false,
            pageNumPending = null,
            scale = 1.0,
            currentPdfUrl = '';

        // Get books from localStorage or initialize with sample data
        function getBooks() {
            const storedBooks = localStorage.getItem(STORAGE_KEY);
            return storedBooks ? JSON.parse(storedBooks) : initialBooks;
        }

        // Save books to localStorage
        function saveBooks(books) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
        }

        // Generate a unique ID
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
        }

        // Render books in the grid
        function renderBooks(books = getBooks()) {
            const container = document.getElementById('books-container');
            const emptyState = document.getElementById('empty-state');
            
            container.innerHTML = '';
            
            if (books.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }
            
            emptyState.classList.add('hidden');
            
            books.forEach((book, index) => {
                const bookCard = document.createElement('div');
                bookCard.className = `book-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 fade-in`;
                bookCard.style.animationDelay = `${index * 0.1}s`;
                
                bookCard.innerHTML = `
                    <div class="relative h-48 overflow-hidden">
                        <img src="${book.coverUrl || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'}" 
                             alt="${book.title}" 
                             class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <h3 class="text-white font-bold text-lg truncate">${book.title}</h3>
                            <p class="text-white/80 text-sm">${book.author}</p>
                        </div>
                    </div>
                    <div class="p-4">
                        <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">${book.description || 'No hay descripción disponible.'}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-gray-500 dark:text-gray-400">${new Date(book.uploadedAt).toLocaleDateString()}</span>
                            <button class="view-book px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-md transition-colors" data-id="${book.id}">
                                <i class="fas fa-eye mr-1"></i> Ver
                            </button>
                        </div>
                    </div>
                `;
                
                container.appendChild(bookCard);
            });
            
            // Add event listeners to view buttons
            document.querySelectorAll('.view-book').forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    const bookId = this.getAttribute('data-id');
                    viewBook(bookId);
                });
            });
        }

        // View book details and PDF
        function viewBook(bookId) {
            const books = getBooks();
            const book = books.find(b => b.id === bookId);
            if (!book) return;
            
            // Show PDF viewer
            document.getElementById('main-content').classList.add('hidden');
            document.getElementById('pdf-viewer-container').classList.remove('hidden');
            document.getElementById('pdf-title').textContent = `${book.title} - ${book.author}`;
            
            // Load the PDF
            currentPdfUrl = book.fileUrl;
            loadPdf(book.fileUrl);
        }

        // PDF Viewer functions
        function loadPdf(url) {
            pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
                pdfDoc = pdfDoc_;
                document.getElementById('page-num').textContent = `Página 1 de ${pdfDoc.numPages}`;
                
                // Reset page number and scale
                pageNum = 1;
                scale = 1.0;
                
                // Render the first page
                renderPage(pageNum);
            }).catch(function(error) {
                alert('Error al cargar el PDF: ' + error.message);
                closePdfViewer();
            });
        }

        function renderPage(num) {
            pageRendering = true;
            
            pdfDoc.getPage(num).then(function(page) {
                const viewport = page.getViewport({ scale: scale });
                const canvas = document.getElementById('pdf-render');
                const context = canvas.getContext('2d');
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                
                renderTask.promise.then(function() {
                    pageRendering = false;
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                });
            });
            
            document.getElementById('page-num').textContent = `Página ${num} de ${pdfDoc.numPages}`;
        }

        function queueRenderPage(num) {
            if (pageRendering) {
                pageNumPending = num;
            } else {
                renderPage(num);
            }
        }

        function onPrevPage() {
            if (pageNum <= 1) return;
            pageNum--;
            queueRenderPage(pageNum);
        }

        function onNextPage() {
            if (pageNum >= pdfDoc.numPages) return;
            pageNum++;
            queueRenderPage(pageNum);
        }

        function onZoomIn() {
            scale += 0.25;
            queueRenderPage(pageNum);
        }

        function onZoomOut() {
            if (scale <= 0.5) return;
            scale -= 0.25;
            queueRenderPage(pageNum);
        }

        function closePdfViewer() {
            document.getElementById('pdf-viewer-container').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
        }

        function downloadCurrentPdf() {
            const link = document.createElement('a');
            link.href = currentPdfUrl;
            link.download = currentPdfUrl.split('/').pop() || 'documento.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Handle book upload
        function handleUpload(e) {
            e.preventDefault();
            
            const title = document.getElementById('book-title').value;
            const author = document.getElementById('book-author').value;
            const description = document.getElementById('book-description').value;
            const coverFile = document.getElementById('book-cover').files[0];
            const pdfFile = document.getElementById('book-file').files[0];
            
            if (!title || !author || !pdfFile) {
                alert('Por favor complete todos los campos requeridos');
                return;
            }
            
           
            
            const newBook = {
                id: generateId(),
                title,
                author,
                description,
                coverUrl: coverFile ? URL.createObjectURL(coverFile) : '',
                fileUrl: URL.createObjectURL(pdfFile),
                uploadedAt: new Date().toISOString()
            };
            
            const books = getBooks();
            books.unshift(newBook);
            saveBooks(books);
            
            // Reset form and close modal
            document.getElementById('upload-form').reset();
            document.getElementById('upload-modal').classList.add('hidden');
            
            // Re-render books
            renderBooks();
            
            alert(`Libro "${title}" subido exitosamente!`);
        }

        // Search books
        function searchBooks() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const books = getBooks();
            
            if (!searchTerm) {
                renderBooks(books);
                return;
            }
            
            const filteredBooks = books.filter(book => 
                book.title.toLowerCase().includes(searchTerm) || 
                book.author.toLowerCase().includes(searchTerm) ||
                (book.description && book.description.toLowerCase().includes(searchTerm))
            );
            
            renderBooks(filteredBooks);
        }

        // Toggle dark mode
        function toggleDarkMode() {
            const html = document.documentElement;
            html.classList.toggle('dark');
            localStorage.setItem('darkMode', html.classList.contains('dark'));
        }

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            // Check for saved dark mode preference
            if (localStorage.getItem('darkMode') === 'true' || 
                (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            }
            
            // Render initial books
            renderBooks();
            
            // Event listeners
            document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);
            document.getElementById('upload-btn').addEventListener('click', function() {
                document.getElementById('upload-modal').classList.remove('hidden');
            });
            document.getElementById('close-modal').addEventListener('click', function() {
                document.getElementById('upload-modal').classList.add('hidden');
            });
            document.getElementById('cancel-upload').addEventListener('click', function() {
                document.getElementById('upload-form').reset();
                document.getElementById('upload-modal').classList.add('hidden');
            });
            document.getElementById('submit-upload').addEventListener('click', handleUpload);
            document.getElementById('search-input').addEventListener('input', searchBooks);
            
            // PDF Viewer controls
            document.getElementById('close-pdf').addEventListener('click', closePdfViewer);
            document.getElementById('prev-page').addEventListener('click', onPrevPage);
            document.getElementById('next-page').addEventListener('click', onNextPage);
            document.getElementById('zoom-in').addEventListener('click', onZoomIn);
            document.getElementById('zoom-out').addEventListener('click', onZoomOut);
            document.getElementById('download-pdf').addEventListener('click', downloadCurrentPdf);
            
            // Prevent default anchor behavior
            document.querySelectorAll('a').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                });
            });
        });