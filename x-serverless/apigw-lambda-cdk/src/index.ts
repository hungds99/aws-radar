export const handler = async (event: any, context: any) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Hello World",
            data: null
        })
    }
}


const generateTodos = () => {
    const todos = [];
    for (let i = 1; i <= 10; i++) {
        todos.push({
            id: i,
            title: `Todo ${i}`,
            description: `Todo ${i} description`
        });
    }
    return todos;
}

const TODOS_DATA = generateTodos();

export const todos = async (event: any, context: any) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Todos List",
            data: TODOS_DATA
        })
    }
}

export const todoById = async (event: any, context: any) => {
    const { id } = event.pathParameters;
    const todo = TODOS_DATA.find(todo => todo.id == id);
    if (!todo) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: "Todo Not Found",
                data: null
            })
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Todo Detail",
            data: todo
        })
    }
}

export const createTodo = async (event: any, context: any) => {
    const { title, description } = JSON.parse(event.body);
    const newTodo = {
        id: TODOS_DATA.length + 1,
        title,
        description
    };
    TODOS_DATA.push(newTodo);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Todo Created",
            data: newTodo
        })
    }
}

export const updateTodo = async (event: any, context: any) => {
    const { id } = event.pathParameters;
    const { title, description } = JSON.parse(event.body);
    const todo = TODOS_DATA.find(todo => todo.id == id);
    if (!todo) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: "Todo Not Found",
                data: null
            })
        }
    }
    todo.title = title;
    todo.description = description;
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Todo Updated",
            data: todo
        })
    }
}

export const deleteTodo = async (event: any, context: any) => {
    const { id } = event.pathParameters;
    const todoIndex = TODOS_DATA.findIndex(todo => todo.id == id);
    if (todoIndex === -1) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: "Todo Not Found",
                data: null
            })
        }
    }
    TODOS_DATA.splice(todoIndex, 1);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Todo Deleted",
            data: null
        })
    }
}
