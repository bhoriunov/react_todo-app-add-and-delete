/* eslint-disable max-len */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { getTodos, USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import { client } from './utils/fetchClient';
import classNames from 'classnames';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      setError(null);

      try {
        const fetchedTodos = await getTodos();

        setTodos(fetchedTodos);
      } catch {
        setError('Unable to load todos');
      }
    };

    fetchTodos();
  }, []);

  useEffect((): void => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') {
      return !todo.completed;
    }

    if (filter === 'completed') {
      return todo.completed;
    }

    return true;
  });

  const handleAddTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newTodo.trim()) {
      setError('Title should not be empty');
      inputRef.current?.focus();

      return;
    }

    const tempId = Date.now();
    const tempTodoItem: Todo = {
      id: tempId,
      title: newTodo.trim(),
      completed: false,
      userId: USER_ID,
    };

    setTempTodo(tempTodoItem);
    setNewTodo('');
    setIsLoading(true);

    try {
      const newTodoData = await client.post<Todo>('/todos', {
        title: newTodo,
        userId: USER_ID,
        completed: tempTodoItem.completed,
      });

      setTodos(prev => [...prev, newTodoData]);
    } catch {
      setError('Unable to add todo');
      setTempTodo(null);
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    setLoadingIds(prev => [...prev, todoId]);

    try {
      await client.delete(`/todos/${todoId}`);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch {
      setError('Unable to delete todo');
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== todoId));
    }
  };

  const handleClearCompleted = async () => {
    const completedIds = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setLoadingIds(completedIds);

    try {
      await Promise.all(
        completedIds.map(todo => client.delete(`/todos/${todo.id}`)),
      );

      setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
    } catch {
      setError('Unable to clear completed todos');
    } finally {
      setLoadingIds([]);
    }
  };

  const completedTodosCount = todos.filter(todo => todo.completed).length;
  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* Add a todo on form submit */}
          <form onSubmit={handleAddTodo}>
            <input
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              autoFocus
              disabled={isLoading}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          <div>
            {filteredTodos.map(todo => (
              <div
                key={todo.id}
                data-cy="Todo"
                className={classNames('todo', {
                  completed: todo.completed,
                  loading: loadingIds.includes(todo.id),
                })}
              >
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    checked={todo.completed}
                    disabled={loadingIds.includes(todo.id)}
                  />
                </label>

                <span data-cy="TodoTitle" className="todo__title">
                  {todo.title}
                </span>

                <button
                  type="button"
                  className="todo__remove"
                  data-cy="TodoDelete"
                  onClick={() => handleDeleteTodo(todo.id)}
                  disabled={loadingIds.includes(todo.id)}
                >
                  ×
                </button>

                <div
                  data-cy="TodoLoader"
                  className={classNames('modal overlay', {
                    'is-active': loadingIds.includes(todo.id),
                  })}
                >
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            ))}

            {tempTodo && (
              <div
                data-cy="Todo"
                className="todo temp-item-enter temp-item-enter-active"
              >
                <label className="todo__status-label">
                  <input type="checkbox" className="todo__status" disabled />
                </label>

                <span data-cy="TodoTitle" className="todo__title">
                  {tempTodo.title}
                </span>
                <div
                  data-cy="TodoLoader"
                  className={classNames('modal overlay', {
                    'is-active': isLoading,
                  })}
                >
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            )}
          </div>
        </section>

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {activeTodosCount} items left
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${filter === 'all' ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={() => setFilter('all')}
              >
                All
              </a>
              <a
                href="#/active"
                className={`filter__link ${
                  filter === 'active' ? 'selected' : ''
                }`}
                data-cy="FilterLinkActive"
                onClick={() => setFilter('active')}
              >
                Active
              </a>
              <a
                href="#/completed"
                className={`filter__link ${
                  filter === 'completed' ? 'selected' : ''
                }`}
                data-cy="FilterLinkCompleted"
                onClick={() => setFilter('completed')}
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={completedTodosCount === 0}
              onClick={handleClearCompleted}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>
      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${
          error ? '' : 'hidden'
        }`}
      >
        <button
          type="button"
          className="delete"
          data-cy="HideErrorButton"
          onClick={() => setError(null)}
        />
        {error || ''}
      </div>
    </div>
  );
};
