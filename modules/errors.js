export const loopPromiseCaughtError = (originalActionType, error) =>
`
loop Promise caught when returned from action of type ${originalActionType}.
loop Promises must not throw!

Thrown exception: 
${error}
`;
