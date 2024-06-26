window.onload = async function () {
    document.getElementById("menu-open-btn").addEventListener("click", async function () {
        this.classList.toggle("rotation-rotated");
    });

    const todoList = document.getElementById("backlog-list-container");
    const doingList = document.getElementById("doing-list-container");
    const reviewList = document.getElementById("review-list-container");
    const doneList = document.getElementById("done-list-container");

    const dueDate = document.getElementById("due-date-filter").value;
    const listName = document.getElementById("list-name-filter").value;

    await refreshAllTodos(todoList, doingList, reviewList, doneList, listName, dueDate);

    document.getElementById("create-todo-btn").addEventListener("click", async function () {
        const title = document.getElementById("new-todo-title").value;
        const message = document.getElementById("new-todo-message").value;

        await createTodo(title, message);
    });

    document.getElementById("filter-btn").addEventListener("click", async function () {
        const _dueDate = document.getElementById("due-date-filter").value;
        const _listName = document.getElementById("list-name-filter").value;

        await refreshAllTodos(todoList, doingList, reviewList, doneList, _listName, _dueDate);
    });
}

async function createTodo(title, message) {
    const result = await fetchData(`${apiUrl}/todos`, "POST", localStorage.getItem("jwt"), {
        title: title,
        message: message
    });

    if (result.statusCode == 401) window.location.replace("login.html");

    else if (result.statusCode != 200) alert(result);

    else window.location.reload();
}

async function refreshAllTodos(todoList, doingList, reviewList, doneList, listName, dueDate) {

    try {
        let url = `${apiUrl}/todos`;

        if (listName || dueDate) url += "?";
        if (listName) url += `listName=${listName}`;
        if (listName && dueDate) url += "&";
        if (dueDate) url += `dueDate=${dueDate}`;

        const todosData = await fetchData(url, 'GET', localStorage.getItem("jwt"), null);
        if (todosData.statusCode == 401) window.location.replace("login.html");

        fillList(todoList, todosData.todo);
        fillList(doingList, todosData.doing);
        fillList(reviewList, todosData.review);
        fillList(doneList, todosData.done);
    }
    catch { window.location.replace("login.html"); }
}

async function fillList(list, todoData) {
    list.replaceChildren();

    todoData.forEach(async function (todo) {
        const todoElement = await createTodoItem(todo.id, todo.title, todo.message, todo.dueDate, todo.list);
        list.appendChild(todoElement);
    });
}

async function createTodoItem(id, title, message, dueDate, listName) {
    if (!dueDate) dueDate = "No due date";
    if (!listName) listName = "No list";
    const htmlStr =
        `<div class="container border rounded my-2" id="todo-${id}">
        <div class="d-flex justify-content-between dashed-bottom">
            <div class="todo-title">${title}</div>
            <div class="dropdown">
                <input type="image" src="img/options-vertical-svgrepo-com.svg" alt="opt" height="14"
                    class="my-auto" data-bs-toggle="dropdown" data-bs-target="todo-options-${id}"
                    aria-haspopup="true" aria-expanded="false" />

                <div class="dropdown-menu" id="todo-options-${id}">
                    <span class="dropdown-item cursor-pointer" id="show-todo-change-log-${id}">Change Log</span>
                    <span class="dropdown-item cursor-pointer" id="edit-todo-${id}" data-bs-toggle="modal" data-bs-target="#modalId-${id}">Edit</span>
                    <span class="dropdown-item cursor-pointer" id="delete-todo-${id}">Delete</span>
                    <hr class="dropdown-divider">
                    <div class="dropdown-item" id="move-todo-options-${id}">
                        <span class="dropdown-item cursor-pointer text-left disabled" href="#"
                            data-bs-toggle="collapse" data-bs-target="move-todo-options-${id}">Move
                            to...</span>
                        <div class="side-menu">
                            <span class="cursor-pointer" id="move-to-backlog-${id}" name="move-to-backlog-${id}">ToDo</span>
                            <span class="cursor-pointer" id="move-to-doing-${id}" name="move-to-doing-${id}">Doing</span>
                            <span class="cursor-pointer" id="move-to-review-${id}" name="move-to-review-${id}">Review</span>
                            <span class="cursor-pointer" id="move-to-done-${id}" name="move-to-done-${id}">Done</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        <div class="todo-content">${message}</div>
        <hr>
        <div class="todo-content text-success">${listName}</div>
        <div class="todo-content text-purple">${dueDate}</div>

        <div class="modal fade" id="modalId-${id}" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false" role="dialog"
        aria-labelledby="modalTitleId" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-sm" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalTitleId">
                        Edit todo
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input type="text" placeholder="Title" class="form-control my-2" id="edit-todo-title-${id}" name="edit-todo-title-${id}" value="${title}">
                    <input type="text" placeholder="Message" class="form-control my-2" id="edit-todo-message-${id}" name="edit-todo-message-${id}" value="${message}">
                    
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Close
                    </button>
                    <button type="button" class="btn btn-primary" id="edit-todo-btn-${id}">Save</button>
                </div>
            </div>
        </div>
    </div>`;

    let frag = document.createDocumentFragment(),
        temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }

    const newTitleInput = frag.getElementById(`edit-todo-title-${id}`);
    const newMessageInput = frag.getElementById(`edit-todo-message-${id}`);

    frag.getElementById(`edit-todo-btn-${id}`).addEventListener("click", async function () {
        const newTitle = newTitleInput.value;
        const newMessage = newMessageInput.value;

        await editTodo(id, newTitle, newMessage);
    });

    frag.getElementById(`delete-todo-${id}`).addEventListener("click", async function () {
        deleteTodo(id);
    });

    frag.getElementById(`move-to-backlog-${id}`).addEventListener("click", async function () {
        await editTodoStatus(id, "Todo");
    });
    frag.getElementById(`move-to-doing-${id}`).addEventListener("click", async function () {
        await editTodoStatus(id, "Doing");
    });
    frag.getElementById(`move-to-review-${id}`).addEventListener("click", async function () {
        await editTodoStatus(id, "Review");
    });
    frag.getElementById(`move-to-done-${id}`).addEventListener("click", async function () {
        await editTodoStatus(id, "Done");
    });

    frag.getElementById(`show-todo-change-log-${id}`).addEventListener("click", async function () {
        const modal = new bootstrap.Modal(document.getElementById("todo-details-modal"), {});
        const modalChangeLog = document.getElementById("change-log-modal");
        const todoData = await getTodoHistory(id);

        modalChangeLog.replaceChildren();

        todoData.forEach(async function (todo) {
            modalChangeLog.append(await createTodoItemSimple(todo.id, todo.title, todo.message, todo.dueDate, todo.list, todo.status));
        });

        modal.show();
    });

    return frag;
}

async function editTodo(id, newTitle, newMessage) {
    const result = await fetchData(`${apiUrl}/todos/${id}`, "PATCH", localStorage.getItem("jwt"), {
        title: newTitle,
        message: newMessage
    });

    if (result.statusCode == 401) window.location.replace("login.html");

    else if (result.statusCode != 200) alert(result);

    else window.location.reload();
}

async function editTodoStatus(id, status) {
    const result = await fetchData(`${apiUrl}/todos/${id}`, "PATCH", localStorage.getItem("jwt"), {
        status: status
    });

    if (result.statusCode == 401) window.location.replace("login.html");

    else if (result.statusCode != 200) alert(result);

    else window.location.reload();
}

async function deleteTodo(id) {
    const result = await fetchData(`${apiUrl}/todos/${id}`, "DELETE", localStorage.getItem("jwt"), null);

    if (result.statusCode == 401) window.location.replace("login.html");

    else window.location.reload();
}

async function getTodoHistory(id) {
    let url = `${apiUrl}/todo-history/${id}`;

    const todosData = await fetchData(url, 'GET', localStorage.getItem("jwt"), null);

    if (todosData.statusCode == 401) window.location.replace("login.html");

    return todosData;
}

async function createTodoItemSimple(id, title, message, dueDate, listName, status) {
    if (!dueDate) dueDate = "No due date";
    if (!listName) listName = "No list";
    const htmlStr =
        `<div class="container border rounded my-2" id="todo-${id}">
        <div class="d-flex justify-content-between dashed-bottom">
            <div class="todo-title">${title}</div>
        </div>
        <div class="todo-content">${message}</div>
        <hr>
        <div class="todo-content text-success">${listName}</div>
        <div class="todo-content text-purple">${dueDate}</div>
        <div class="todo-content text-purple">${status}</div>
    </div>`;

    let frag = document.createDocumentFragment(),
        temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }

    return frag;
}