// Minigrid (libreria grilla)
// Es una libreria liviana para generar una grilla mas dinamica
(function(){
    var grid;
    function init() {
        grid = new Minigrid({
            container: '#notesList',
            item: '.note',
            gutter: 18
        });
        grid.mount();
    }
    
    // mount
    function update() {
        grid.mount();
    }
    
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('resize', update);
})();

// ------------------------------------------------------- //

// Contructor del objeto Note
class Note{
    constructor(title, body, tags, date, id){
        this.title = title;
        this.body = body;
        this.tags = tags;
        this.date = date;
        this.id = id;
    }
}

// Constructor del objeto Model
// Definicion de estructura de datos
class Model {
    constructor() {
        this.notes = [];
    }

    // LOCAL STORAGE
    saveStorageData(){
        localStorage.setItem('db', JSON.stringify(this.notes));
    }
    getStorageData(){
        return JSON.parse(localStorage.getItem('db'));
    }
    reloadNotes(){
        this.notes = this.getStorageData();
    }

    // CREACION Y EDICION DE NOTAS
    createNote(title, body, tags, id){
        this.notes.push(new Note(title, body, tags, Date.now(), id));
        this.saveStorageData();
    }
    removeNote(id){
        this.notes.splice(this.notes.findIndex(note => note.id == id), 1);
        this.saveStorageData();
    }
    editNote(id, title, body, tags){
        const index = this.findNoteIndexById(id);
        this.notes[index].title = title;
        this.notes[index].body = body;
        this.notes[index].tags = tags;
        this.notes[index].date = Date.now();
        this.saveStorageData();
    }
    pushNewTag(id, tag){
        const index = this.findNoteIndexById(id);
        if (!this.notes[index].tags.includes(tag)){
            this.notes[index].tags.push(tag);
            this.saveStorageData();
            return true;
        } else {
            return false;
        }
    }

    // CONSULTAS DINAMICAS
    // Recibe una lista de notas y devuelve una lista con todas las etiquetas sin repetir
    renderTagList(noteList){
        let result = new Array;
        for (let i = 0; i < noteList.length; i++) {
            noteList[i].tags.forEach(tag => {if (!result.includes(tag)) { result.push(tag)}});
        }
        return result;
    }
    // Recibe un id y encuentra el indice de esa nota en el modelo
    findNoteIndexById(id){
        return this.notes.findIndex(note => note.id == id);
    }
    // Filtra una notesList y devuelve todas las que contengan todas las tags de tagsList
    filterNotesByTags(notesList, tagsList){
        if (tagsList.length == 0) {
            return notesList;
        } else {
            let result = [];
            notesList.forEach(note => {
                // Un contador para verificar que la nota contenga todas las etiquetas seleccionadas
                let count = 0;
                for (let index = 0; index < tagsList.length; index++) {
                    if (note.tags.some(tag => tag === tagsList[index].innerHTML)) {
                        count ++;
                    }
                }
                if (count === tagsList.length){
                    result.push(note);
                }
            });
            return result;
        }
    }
    // Filtra una notesList y devuelve todas las que incluyan el string en su title o body
    filterNotesByString(notesList, string){
        if (string === '') {
            return notesList
        }
        const result = notesList.filter(note => {
            return (
                note.title.toLowerCase().includes(string) ||
                note.body.toLowerCase().includes(string) ||
                note.tags.some(tag => tag === string)
            )
        });
        return result;
    }
}

// Constructor del objeto View
class View {
    constructor() {
        // Definicion de elementos
        this.newNoteBtn = $('#newNoteBtn');
        this.noteEdit = $('#noteEdit');
        this.formTitle = $('#formTitle');
        this.formBody = $('#formBody');
        this.formTags = $('#formTags');
        this.form = $('#form');
        this.notesList = $('#notesList');
        this.tagList = $(".tagList__ul");
        this.searchBar = $('.searchBar__input');
        this.searchBarForm = $('.searchBar');
        this.messageBox = $('.message');

        // EVENT LISTENERS (call)
        this.bindToggleEditor();
        this.bindFormSubmit();
        this.bindSearchBar();
        this.bindSearchBarForm();
        this.bindSelectTag();
        this.bindNoteClick();
        this.bindTagInput();
        this.bindNoteEdit();
        
        // Actualiza la tagsList en base a las notas renderizadas del DOM
        // (Aqui aplique un mutation observer como una alternativa al obsoleto Mutation Event)
        this.mutationObserver = new MutationObserver(() => {
            const notesList = Array.from(this.notesList.children());
            let tagList = new Array;
            notesList.forEach(note => {
                const noteTagList = Array.from($(`#${note.id} .tagsContainer`).children());
                noteTagList.forEach(tag => {
                    if (!tagList.includes(tag.innerHTML)) tagList.push(tag.innerHTML)
                })
            });
            this.clearUnselectedTagList();
            this.renderTagList(tagList);
        });
        this.mutationObserver.observe(document.getElementById('notesList'), {childList: true, subtree: true});
    }
    // Renderiza una nota
    renderNote(note){
        // Crear el HTML de las etiquetas de la nota.
        let tags = '';
        let tagsContainer = '';
        for (let index = 0; index < note.tags.length; index++) {
            if (note.tags[index] != '') {
                tags = tags + `<span class="tag">${note.tags[index]}</span>`;
            }
        }
        if (tags != '') {
            tagsContainer = `<div class="tagsContainer">${tags}</div>`;
        } else {
            tagsContainer = '';
        }
        // Crea e incrusta el HTML de la nota
        this.notesList.prepend(`
        <li class="note card" id="${note.id}">
            <div class="textContainer">
                <h3 class="note__title">${note.title}</h3>
                <p class="note__body">${note.body}</p>
            </div>
            ${tagsContainer}
            <div class="noteMenu">
            <!-- <img src="./img/color.svg" alt="Color" class="noteMenu__color"> -->
                <img src="./img/tag.svg" alt="Nueva etiqueta" class="noteMenu__newTag">
                <input type="text" class="noteMenu__tagInput">
                <img src="./img/delete.svg" alt="Eliminar nota" class="noteMenu__delete">
            </div>
            <div class="timeStamp">
                <span class="timeStamp__text">Última edicion: ${this.renderTime(note.date)}.</span>
            </div>
        </li>`);
        this.checkForEmptyList();
    }
    // Renderiza un string segun la antiguedad de la nota
    renderTime(time){
        // Diferencia entre 'time' y Date.now() en minutos
        const difference = parseInt((Date.now() - time) / (1000 * 60));

        return difference < 1
        ? 'Hace un instante'
        : difference == 1
        ? '1 minuto atras'
        : Math.round(difference / 60) == 1
        ? '1 hora atras'
        : difference < 60
        ? `${difference} minutos atras`
        : Math.round(difference / 1440) == 1
        ? '1 dia atras'
        : difference < 1440
        ? `${Math.round(difference / 1440)} horas atras`
        : parseInt(difference / 43200) == 1
        ? '1 mes atras'
        : difference < 43200
        ? `${Math.round(difference / 1440)} dias atras`
        : difference < 518400
        ? `${Math.round(difference / 43200)} meses atras`
        : 'Mas de un año'
    }
    // Inserta una nueva etiqueta
    insertNewTag(noteId, tag){
        if (!$(`#${noteId}`).html().includes('tagsContainer')) {
            $(`#${noteId}`).append('<div class="tagsContainer"></div>');
        }
        $(`#${noteId} .tagsContainer`).append(`<span class="tag">${tag}</span>`);
    }
    // Vacia la lista de notas
    clearList(){
        this.notesList.empty()
    }
    // Renderiza una lista de notas
    renderList(list){
        this.clearList();
        list.map((note) => this.renderNote(note));
        this.grid();
        this.checkForEmptyList();
    }
    // Vacia la tagsList
    clearTagList(){
        this.tagList.empty();
    }
    // Elimina de la tagsList todas las etiquetas sin seleccionar
    clearUnselectedTagList(){
        const tagList = Array.from(this.tagList.children());
        for (let index = 0; index < tagList.length; index++) {
            if (!tagList[index].className.includes('selected')) {
                tagList[index].remove();
            }
        }
    }
    // Renderiza una tagsList
    renderTagList(tagList){
        // Renderiza todos los tags de tagList[] que no se repitan en el HTML
        tagList.sort()
        .forEach(tag => {
            const list = Array.from(this.tagList.children());
            let count = 0;
            for (let index = 0; index < list.length; index++) {
                if (tag == list[index].innerHTML) {
                    count++;
                }
            }
            if (count == 0) {
                this.tagList.append(`<li class="tagList__li tag">${tag}</li>`);
            }
        });
    }
    // Actualiza la grilla
    grid(){
        window.grid = new Minigrid({
            container: '#notesList',
            item: '.card',
            gutter: 18
        });
        grid.mount();
    }
    // Abre y cierra el editor
    toggleEditor(){
        this.noteEdit.slideToggle(150);
        this.noteEdit.removeData('id');
    }
    // Abre una nota en el editor
    openNoteEdit(title, body, tags, id){
        this.toggleEditor();
        this.formTitle.val(title);
        this.formBody.val(body);
        this.formTags.val(tags.join(' '));
        this.noteEdit.data('id', id);
        this.formTitle.focus();
    }
    // Vacia y cierra el editor
    closeEditor(){
        this.form[0].reset();
        this.toggleEditor();
    }
    // Si no hay notas renderizadas, muestra un mensaje
    checkForEmptyList(){
        let message = "";
        if (this.searchBar.val() == '') {
            // no hay busqueda
            if (this.notesList.children().length == 0) {
                message = `
                <p>Todavía no hay notas para mostrar</p>
                <p class="cta">Prueba cargando las notas de ejemplo</p>`;
            } else {
                message = '';
            }
        } else {
            // hay busqueda
            if (this.notesList.children().length == 0) {
                message = `<p>Ninguna nota cumple el criterio de búsqueda.</p>`;
            } else {
                message = '';
            }
        }
        this.messageBox.html(message);
        this.bindCTA();
    }

    // EVENT LISTENERS (declare)
    bindCTA(){
        $('.cta').on('click', () => app.handleLoadExamples())
    }
    // Boton "Crear nota"
    bindToggleEditor() {
        this.newNoteBtn.on('click', () => {
            this.toggleEditor();
            this.formTitle.focus();
        });
    }
    // Submit del editor
    bindFormSubmit(){
        this.form.submit( e => {
            e.preventDefault();
            app.handleFormSubmit(this.formTitle.val(), this.formBody.val(), this.formTags.val().split(' '), this.noteEdit.data('id'));
        });
    }
    // Click en nota
    bindNoteClick(){
        this.notesList.on('click', '.note', (e) => {
            switch (e.target.className) {
                case 'noteMenu__newTag':
                    e.target.nextElementSibling.focus();
                    break;
                case 'noteMenu__delete':
                    app.handleDeleteNote(e);
                    break;
                case 'noteMenu__tagInput':
                    break;
                default:
                    app.editNote(e);
                    break;
            };
        });
    }
    // Input tag de notas
    bindTagInput(){
        this.notesList.on('keyup', '.noteMenu__tagInput', e => {
            app.handleTagInput(e);
        });
    }
    // Barra de busqueda
    bindSearchBarForm(){this.searchBarForm.on('submit', (e) => e.preventDefault())}
    bindSearchBar(){
        this.searchBar.on('keyup', () => app.handleSearchBar(this.searchBar.val()))
    }
    // Seleccion de etiquetas
    bindSelectTag(){
        this.tagList.on('click', (e) => {
            if (e.target.nodeName == 'LI') {
                e.target.classList.toggle('tagList__li--selected')
                app.handleSelectTag();
            }
        })
    }
    // Editor de notas
    bindNoteEdit(){
        this.noteEdit.on('click', e => {
            switch (e.target.id) {
                case 'deleteBtn':
                    this.closeEditor();
                    break;
                case 'noteEdit':
                    this.closeEditor();
                    break;
                case 'tagBtn':
                    e.target.nextElementSibling.focus();
                    break;
                default:
                    break;
            }
        });
        this.noteEdit.on('keyup', e => {
            if (e.keyCode == 27) this.closeEditor();
        })
    }

}

// Constructor del objeto Controller
class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        // App init
        this.model.reloadNotes();
        this.view.renderList(this.model.notes);
        this.view.clearTagList();
        this.view.renderTagList(this.model.renderTagList(this.model.notes));
    }
    // Maneja el submit del editor
    handleFormSubmit(title, body, tags, id){
        // En caso de pasar el parametro id, se toma como la edicion una nota existente
        if (id) {
            if (title == '' && body == '') {
                this.model.removeNote(id);
                this.view.toggleEditor();
                this.view.renderList(this.model.notes);
            } else {
                this.model.editNote(id, title, body, tags);
                this.view.toggleEditor();
                this.view.form[0].reset();
                this.view.renderList(this.model.notes);
            }
            // Si no, crea una nueva nota
        } else if (title || body) {
            this.model.createNote(title, body, tags.filter(Boolean).map(tag => tag.toLowerCase()), Date.now());
            this.view.renderNote(this.model.notes[this.model.notes.length - 1]);
            this.view.form[0].reset();
            this.view.toggleEditor();
            this.view.grid();
        } else {
            this.view.toggleEditor();
        } 
    }
    // Abre una nota en el editor
    editNote(e){
        // recupera el id de la nota segun el objeto evento
        const noteId = e => {
            if (Array.from(e.target.classList).includes('note')) {
                return e.target.id;
            } if (Array.from(e.target.parentElement.classList).includes('note')) {
                return e.target.parentElement.id;
            } if (Array.from(e.target.parentElement.parentElement.classList).includes('note')) {
                return e.target.parentElement.parentElement.id;
            }
        }
        // usa el id obtenido para recuperar los datos del modelo y
        // abrir el editor de notas
        const noteIndex = this.model.findNoteIndexById(noteId(e));
        const note = this.model.notes[noteIndex];
        this.view.openNoteEdit(note.title, note.body, note.tags, note.id);
    }
    // Maneja el event listener del input tag de las notas
    handleTagInput(e){
        if (e.keyCode == 32 || e.keyCode == 13){
            if (e.target.value != ' '){
                const id = e.target.parentElement.parentElement.id;
                if (this.model.pushNewTag(id, e.target.value)) {
                    this.view.insertNewTag(e.target.parentElement.parentElement.id, e.target.value);
                    this.view.renderList(this.model.notes);
                }
                e.target.value = '';
            } else {
                e.target.value = '';
            }
        }
    }
    // Elimina una nota
    handleDeleteNote(e){
        this.model.removeNote(e.target.parentElement.parentElement.id);
        e.target.parentElement.parentElement.remove();
        this.view.grid();
        this.view.checkForEmptyList();
    }
    // Maneja el event listener de la barra de busqueda
    handleSearchBar(busqueda){
        const tags = Array.from(this.view.tagList.children());
        const selectedTags = tags.filter(tag => tag.className.includes('selected'));
        this.view.renderList(this.model.filterNotesByString(this.model.filterNotesByTags(this.model.notes, selectedTags), busqueda));
    }
    // Selecciona una etiqueta
    handleSelectTag(){
        const tags = Array.from(this.view.tagList.children());
        const selectedTags = tags.filter(tag => tag.className.includes('selected'));
        const noteList = this.model.filterNotesByTags(this.model.notes, selectedTags);
        this.view.renderList(noteList);
    }
    handleLoadExamples(){
        $.getJSON('./data/examples.json', function (respuesta, estado) {
            if(estado === "success"){
                respuesta.forEach(nota => app.model.createNote(nota.title, nota.body, nota.tags, nota.id));
                app.view.renderList(app.model.notes);
            }
        });
    };
}


const app = new Controller(new Model(), new View());
