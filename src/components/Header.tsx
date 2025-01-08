import React, { useRef } from 'react';

interface HeaderProps {
  newTodo: string;
  setNewTodo: (value: string) => void;
  handleAddTodo: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  newTodo,
  setNewTodo,
  handleAddTodo,
  isLoading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="todoapp__header">
      <form onSubmit={handleAddTodo}>
        <input
          ref={inputRef}
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          disabled={isLoading}
        />
      </form>
    </header>
  );
};