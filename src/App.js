import React, { useReducer, useEffect } from "react";
import "./App.css";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { ...state, todos: action.payload };
    case "SET_INPUT":
      return { ...state, input: action.payload };
    case "SET_EDIT":
      return { ...state, editingId: action.id, editingText: action.text };
    case "SET_EDIT_TEXT":
      return { ...state, editingText: action.payload };
    case "TOGGLE_MODE":
      const newMode = !state.darkMode;
      localStorage.setItem("darkMode", JSON.stringify(newMode));
      return { ...state, darkMode: newMode };
    case "ADD_SUCCESS":
      return { ...state, todos: [...state.todos, action.payload], input: "" };
    case "TOGGLE_SUCCESS":
    case "EDIT_SUCCESS":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
        editingId: null,
        editingText: "",
      };
    case "DELETE_SUCCESS":
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
      };
    case "CLEAR_SUCCESS":
      return { ...state, todos: [] };
    default:
      return state;
  }
};

export default function App() {
  const [state, dispatch] = useReducer(reducer, {
    todos: [],
    input: "",
    editingId: null,
    editingText: "",
    darkMode: JSON.parse(localStorage.getItem("darkMode")) || false,
  });

  const { todos, input, editingId, editingText, darkMode } = state;

  useEffect(() => {
    fetch("http://localhost:3005/todos")
      .then((res) => res.json())
      .then((data) => dispatch({ type: "FETCH_SUCCESS", payload: data }));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark_mode", darkMode);
    document.body.style.backgroundImage = darkMode
      ? "url('/images/darkback.png')"
      : "url('/images/back.png')";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "100% 280px";
    document.body.style.backgroundPosition = "top";
    document.body.style.backgroundColor = darkMode ? "#363535" : "#FFFFFF";
  }, [darkMode]);

  const addTask = async () => {
    if (!input.trim()) return;
    const newTodo = {
      id: new Date().getTime().toString(),
      task: input.trim(),
      isDone: false,
    };
    const result = await fetch("http://localhost:3005/todos", {
      method: "POST",
      body: JSON.stringify(newTodo),
    });
    const saved = await result.json();
    dispatch({ type: "ADD_SUCCESS", payload: saved });
  };

  const toggleTask = async (todo) => {
    const updated = { ...todo, isDone: !todo.isDone };
    await fetch(`http://localhost:3005/todos/${todo.id}`, {
      method: "PUT",
      body: JSON.stringify(updated),
    });
    dispatch({ type: "TOGGLE_SUCCESS", payload: updated });
  };

  const deleteTask = async (id) => {
    await fetch(`http://localhost:3005/todos/${id}`, {
      method: "DELETE",
    });
    dispatch({ type: "DELETE_SUCCESS", payload: id });
  };

  const saveEdit = async (e) => {
    if (e.key === "Enter" && editingText.trim()) {
      const todo = todos.find((t) => t.id === editingId);
      const updated = { ...todo, task: editingText.trim() };
      await fetch(`http://localhost:3005/todos/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      dispatch({ type: "EDIT_SUCCESS", payload: updated });
    }
  };

  const clearAll = async () => {
    await Promise.all(
      todos.map((t) =>
        fetch(`http://localhost:3005/todos/${t.id}`, {
          method: "DELETE",
        })
      )
    );
    dispatch({ type: "CLEAR_SUCCESS" });
  };

  return (
    <div className="main">
      <div className="titleIcon">
        <h1>TODO</h1>
        <i
          className="fa-solid fa-moon mode"
          style={{ display: darkMode ? "none" : "block" }}
          onClick={() => dispatch({ type: "TOGGLE_MODE" })}
        ></i>
        <i
          className="fa-solid fa-sun mode"
          style={{ display: darkMode ? "block" : "none" }}
          onClick={() => dispatch({ type: "TOGGLE_MODE" })}
        ></i>
      </div>

      <form
        className="minibox"
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <input
          type="text"
          placeholder="Create a new task !"
          value={input}
          onChange={(e) =>
            dispatch({ type: "SET_INPUT", payload: e.target.value })
          }
        />
        <button className="minibtn">ADD</button>
      </form>

      <div className="second">
        <ul className="tasks">
          {todos.length === 0 && (
            <div className="notasks">There are not any tasks ...</div>
          )}
          {todos.map((todo) => (
            <li key={todo.id}>
              <img
                src={
                  todo.isDone
                    ? darkMode
                      ? "/images/darktick.png"
                      : "/images/tick.png"
                    : "/images/circle.png"
                }
                style={{ borderRadius: "50%" }}
                onClick={() => toggleTask(todo)}
              />
              {editingId === todo.id ? (
                <input
                  className="edit_input"
                  type="text"
                  value={editingText}
                  onChange={(e) =>
                    dispatch({ type: "SET_EDIT_TEXT", payload: e.target.value })
                  }
                  onKeyDown={saveEdit}
                />
              ) : (
                <p
                  onClick={() => toggleTask(todo)}
                  className={todo.isDone ? "check" : ""}
                >
                  {todo.task}
                </p>
              )}
              <i
                className={`fa-solid fa-pen-to-square ${
                  todo.isDone ? "disabled" : ""
                }`}
                onClick={() =>
                  !todo.isDone &&
                  dispatch({
                    type: "SET_EDIT",
                    id: todo.id,
                    text: todo.task,
                  })
                }
              ></i>
              <i
                className="fa-solid fa-xmark"
                onClick={() => deleteTask(todo.id)}
              ></i>
            </li>
          ))}
        </ul>

        {todos.length > 0 && (
          <button className="clear_btn" onClick={clearAll}>
            CLEAR ALL
          </button>
        )}
      </div>
    </div>
  );
}
