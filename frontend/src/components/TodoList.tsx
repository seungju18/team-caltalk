import FilterBar from "./FilterBar";
import TodoRow from "./TodoRow";
import { useTodos } from "../hooks/useTodos";
import { useCategories } from "../hooks/useCategories";
import { useTodoMutations } from "../hooks/useTodoMutations";
import { useNavigation } from "../hooks/useNavigation";
import { useLang } from "../hooks/useLang";

export default function TodoList() {
  const t = useTodos();
  const { categories } = useCategories();
  const { toggleComplete, isToggling, toggleError } = useTodoMutations();
  const { openEdit } = useNavigation();
  const { t: tl, te } = useLang();
  const error = t.todosError ?? toggleError;
  return (
    <>
      <FilterBar
        filter={t.filter}
        categoryId={t.categoryId}
        categories={categories}
        onFilter={t.setFilter}
        onCategory={t.setCategoryFilter}
      />
      {error && (
        <p
          role="alert"
          className="px-4 py-2 text-sm text-danger bg-danger/10 border-b border-line"
        >
          {te(error)}
        </p>
      )}
      {t.isTodosLoading ? (
        <p className="py-16 text-center text-sm text-fg-muted">
          {tl("common.loading")}
        </p>
      ) : t.todos.length > 0 ? (
        <ul>
          {t.todos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onOpen={openEdit}
              onToggle={toggleComplete}
              disabled={isToggling}
            />
          ))}
        </ul>
      ) : (
        !t.todosError && (
          <p className="py-16 text-center text-sm text-fg-muted">
            {t.emptyText}
          </p>
        )
      )}
    </>
  );
}
