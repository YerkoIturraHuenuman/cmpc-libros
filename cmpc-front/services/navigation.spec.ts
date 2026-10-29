import { redirectToLogin } from './navigation';

describe('redirectToLogin', () => {
  it('intenta navegar a /login', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    redirectToLogin();

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('navigation') }),
    );
    error.mockRestore();
  });
});
