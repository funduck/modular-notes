module.exports = {
    extends: 'google',
    env: {
        node: true,
        es6: true
    },
    rules: {
        indent: [2, 4, {SwitchCase: 1, MemberExpression: 'off'}],
        'max-len': [2, {code: 120, ignoreUrls: true}],
        'comma-dangle': ['error', {
            'arrays': 'ignore',
            'objects': 'ignore',
            'imports': 'ignore',
            'exports': 'ignore',
            'functions': 'never'
        }],
        'guard-for-in': 'off'
    }
};
